import { users, chatMessages, messageReactions, chatRoom, type User, type InsertUser, type ChatMessage, type InsertChatMessage, type MessageReaction, type InsertMessageReaction, type ChatRoom } from "../shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMessages(): Promise<ChatMessage[]>;
  saveMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessageReactions(messageId: number): Promise<MessageReaction[]>;
  addReaction(reaction: InsertMessageReaction): Promise<MessageReaction | null>;
  removeReaction(messageId: number, userId: string, emoji: string): Promise<void>;
  deleteMessage(messageId: number): Promise<void>;
  clearAllMessages(): Promise<void>;
  updateRoomPassword(newPassword: string): Promise<void>;
  getRoomInfo(): Promise<ChatRoom | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(chatMessages.createdAt);
  }

  async saveMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    return await db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId));
  }

  async addReaction(reaction: InsertMessageReaction): Promise<MessageReaction | null> {
    // Check if user already reacted with this emoji
    const existingReaction = await db.select().from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, reaction.messageId),
        eq(messageReactions.userId, reaction.userId),
        eq(messageReactions.emoji, reaction.emoji)
      ));

    if (existingReaction.length > 0) {
      // Return null if duplicate (indicates user already reacted)
      return null;
    }

    // Check if user already has 2 reactions on this message
    const userReactions = await db.select().from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, reaction.messageId),
        eq(messageReactions.userId, reaction.userId)
      ));

    if (userReactions.length >= 2) {
      // Return null if user already has 2 reactions (reaction limit)
      return null;
    }

    const [newReaction] = await db.insert(messageReactions).values(reaction).returning();
    return newReaction;
  }

  async removeReaction(messageId: number, userId: string, emoji: string): Promise<void> {
    await db.delete(messageReactions).where(and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji)
    ));
  }

  async deleteMessage(messageId: number): Promise<void> {
    // Delete all reactions for this message first
    await db.delete(messageReactions).where(eq(messageReactions.messageId, messageId));
    // Delete the message
    await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
  }

  async clearAllMessages(): Promise<void> {
    // Delete all reactions first
    await db.delete(messageReactions);
    // Delete all messages
    await db.delete(chatMessages);
  }

  async updateRoomPassword(newPassword: string): Promise<void> {
    // Update the chat room password (assuming there's only one room with id 1)
    await db.update(chatRoom)
      .set({ password: newPassword })
      .where(eq(chatRoom.id, 1));
  }

  async getRoomInfo(): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRoom).where(eq(chatRoom.id, 1));
    return room;
  }
}

export const storage = new DatabaseStorage();