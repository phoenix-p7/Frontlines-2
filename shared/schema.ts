import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatRoom = pgTable("chat_room", {
  id: serial("id").primaryKey(),
  password: text("password").notNull().default("unite-sovereign100lx"),
  isActive: boolean("is_active").notNull().default(true),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  emoji: text("emoji").notNull(),
  displayName: text("display_name").notNull(),
  message: text("message").notNull(),
  userId: text("user_id").notNull(),
  replyToId: integer("reply_to_id"),
  replyToMessage: text("reply_to_message"),
  replyToDisplayName: text("reply_to_display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(),
  userId: text("user_id").notNull(),
  emoji: text("emoji").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;
export type ChatRoom = typeof chatRoom.$inferSelect;

// Extended types for frontend
export type ChatMessageWithReactions = ChatMessage & {
  reactions: MessageReaction[];
};

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMessageReactionSchema = createInsertSchema(messageReactions);