import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { registerAdminRoutes } from "./admin-routes";
import { setupPollingRoutes } from "./polling-routes";

// Track active users for admin panel (activity-based tracking for REST polling)
const activeUsers = new Map<string, {
  userId: string;
  emoji: string;
  displayName: string;
  lastActivity: number;
}>();

// Clean up inactive users every 30 seconds
setInterval(() => {
  const now = Date.now();
  const inactiveThreshold = 2 * 60 * 1000; // 2 minutes of inactivity
  
  activeUsers.forEach((user, userId) => {
    if (now - user.lastActivity > inactiveThreshold) {
      activeUsers.delete(userId);
    }
  });
}, 30000);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Register admin routes with active users tracking
  registerAdminRoutes(app, activeUsers);

  // Register polling routes for REST API
  setupPollingRoutes(app, activeUsers);

  // Join chat endpoint
  app.post("/api/join", async (req, res) => {
    try {
      const { emoji, displayName, password } = req.body;

      // Get room password from database
      const roomInfo = await storage.getRoomInfo();
      if (!roomInfo || !roomInfo.isActive) {
        return res.status(503).json({ success: false, message: "Chat room is currently unavailable" });
      }

      // Validate password against database
      if (password !== roomInfo.password) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }

      // Generate unique user ID
      const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      const user = {
        emoji,
        displayName,
        userId
      };

      // Track this user as active
      activeUsers.set(userId, {
        userId,
        emoji,
        displayName,
        lastActivity: Date.now()
      });

      res.json({ success: true, user });
    } catch (error) {
      console.error("Join error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // All chat functionality now handled via REST API polling routes

  return httpServer;
}