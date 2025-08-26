import type { Express } from "express";
import { storage } from "./storage";

// Simple admin authentication middleware for polling routes
function authenticateAdmin(req: any, res: any, next: any) {
  const { password } = req.body || req.query;
  if (password === 'unite-sovereign100lx') {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

// In-memory storage for typing users (since typing is temporary)
const typingUsers = new Map<string, {
  emoji: string;
  displayName: string;
  userId: string;
  lastUpdate: number;
}>();

// Clean up stale typing indicators (users who stopped typing but didn't send stop signal)
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5000; // 5 seconds
  
  typingUsers.forEach((user, userId) => {
    if (now - user.lastUpdate > staleThreshold) {
      typingUsers.delete(userId);
    }
  });
}, 2000); // Check every 2 seconds

export function setupPollingRoutes(app: Express, activeUsers?: Map<string, any>) {

  // REST API endpoints for polling mode
  // Get all messages
  app.get('/api/messages', async (req, res) => {
    try {
      // Track user activity if userId is provided in query params
      const userId = req.query.userId as string;
      if (userId && activeUsers) {
        const existingUser = activeUsers.get(userId);
        if (existingUser) {
          existingUser.lastActivity = Date.now();
        }
      }
      
      const messages = await storage.getMessages();
      res.json({ success: true, messages });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
  });

  // Send a message
  app.post('/api/messages', async (req, res) => {
    try {
      const { emoji, displayName, message, userId, replyToId, replyToMessage, replyToDisplayName } = req.body;
      
      const newMessage = await storage.saveMessage({
        emoji,
        displayName,
        message,
        userId,
        replyToId,
        replyToMessage,
        replyToDisplayName
      });

      res.json({ success: true, message: newMessage });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ success: false, error: 'Failed to send message' });
    }
  });

  // Get reactions for a message
  app.get('/api/messages/:messageId/reactions', async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const reactions = await storage.getMessageReactions(messageId);
      res.json({ success: true, reactions });
    } catch (error) {
      console.error('Error fetching reactions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch reactions' });
    }
  });

  // Add reaction to a message
  app.post('/api/messages/:messageId/reactions', async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { emoji, userId, displayName } = req.body;
      
      // Check if user already has 2 reactions on this message
      const existingReactions = await storage.getMessageReactions(messageId);
      const userReactionsCount = existingReactions.filter(r => r.userId === userId).length;
      
      if (userReactionsCount >= 2) {
        return res.status(400).json({ success: false, error: 'You can only add up to 2 reactions per message' });
      }
      
      await storage.addReaction({ messageId, userId, emoji, displayName });
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ success: false, error: 'Failed to add reaction' });
    }
  });

  // Remove reaction from a message
  app.delete('/api/messages/:messageId/reactions', async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { emoji, userId } = req.body;
      
      await storage.removeReaction(messageId, userId, emoji);
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ success: false, error: 'Failed to remove reaction' });
    }
  });

  // Set typing status
  app.post('/api/typing', async (req, res) => {
    try {
      const { emoji, displayName, userId, isTyping } = req.body;
      
      if (isTyping) {
        // Add or update typing user
        typingUsers.set(userId, {
          emoji,
          displayName,
          userId,
          lastUpdate: Date.now()
        });
      } else {
        // Remove typing user
        typingUsers.delete(userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating typing status:', error);
      res.status(500).json({ success: false, error: 'Failed to update typing status' });
    }
  });

  // Get typing users
  app.get('/api/typing', async (req, res) => {
    try {
      const activeTypingUsers = Array.from(typingUsers.values()).filter(user => {
        const now = Date.now();
        return (now - user.lastUpdate) < 3000; // Only show users who were typing within last 3 seconds
      });
      
      res.json({ success: true, typingUsers: activeTypingUsers });
    } catch (error) {
      console.error('Error fetching typing users:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch typing users' });
    }
  });

  // Admin delete message endpoint for polling mode
  app.delete("/api/admin/messages/:id", authenticateAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.deleteMessage(messageId);
      
      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
  });
}