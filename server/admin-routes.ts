import type { Express } from "express";
import { storage } from "./storage";
import fs from "fs/promises";
import path from "path";

// Admin password management
const ADMIN_CONFIG_PATH = path.join(process.cwd(), 'admin-config.json');

interface AdminConfig {
  adminPassword: string;
}

// Load admin config or create default
async function loadAdminConfig(): Promise<AdminConfig> {
  try {
    const data = await fs.readFile(ADMIN_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Default config if file doesn't exist
    const defaultConfig = { adminPassword: 'Prathamesh_xaEVA_P7' };
    await saveAdminConfig(defaultConfig);
    return defaultConfig;
  }
}

// Save admin config
async function saveAdminConfig(config: AdminConfig): Promise<void> {
  await fs.writeFile(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Get current admin password
async function getAdminPassword(): Promise<string> {
  const config = await loadAdminConfig();
  return config.adminPassword;
}

// Admin routes - secure endpoints for chat administration
export function registerAdminRoutes(app: Express, connectedUsers: Map<string, any>) {
  // Admin authentication middleware
  const authenticateAdmin = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      const adminPassword = await getAdminPassword();
      
      if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
        return res.status(401).json({ success: false, message: "Unauthorized admin access" });
      }
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = await getAdminPassword();
      
      if (password === adminPassword) {
        res.json({ success: true, token: adminPassword });
      } else {
        res.status(401).json({ success: false, message: "Invalid admin password" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Get all messages with reactions
  app.get("/api/admin/messages", authenticateAdmin, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      const messagesWithReactions = await Promise.all(
        messages.map(async (message: any) => {
          const reactions = await storage.getMessageReactions(message.id);
          return { ...message, reactions };
        })
      );
      res.json({ success: true, messages: messagesWithReactions });
    } catch (error) {
      console.error("Admin get messages error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Delete a specific message
  app.delete("/api/admin/messages/:id", authenticateAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.deleteMessage(messageId);
      
      // Broadcast message deletion to all connected users
      const broadcastDeletion = {
        type: "message_deleted",
        messageId: messageId
      };
      
      connectedUsers.forEach((user) => {
        if (user.ws && user.ws.readyState === 1) { // WebSocket.OPEN
          user.ws.send(JSON.stringify(broadcastDeletion));
        }
      });
      
      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error("Admin delete message error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Clear all chat history
  app.post("/api/admin/clear-chat", authenticateAdmin, async (req, res) => {
    try {
      await storage.clearAllMessages();
      
      // Broadcast chat clear to all connected users
      const broadcastClear = {
        type: "chat_cleared"
      };
      
      connectedUsers.forEach((user) => {
        if (user.ws && user.ws.readyState === 1) { // WebSocket.OPEN
          user.ws.send(JSON.stringify(broadcastClear));
        }
      });
      
      res.json({ success: true, message: "Chat history cleared successfully" });
    } catch (error) {
      console.error("Admin clear chat error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Change room password
  app.post("/api/admin/change-password", authenticateAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Password cannot be empty" });
      }
      
      await storage.updateRoomPassword(newPassword.trim());
      res.json({ success: true, message: "Room password updated successfully" });
    } catch (error) {
      console.error("Admin change password error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Get currently connected users
  app.get("/api/admin/connected-users", authenticateAdmin, async (req, res) => {
    try {
      const users = Array.from(connectedUsers.values()).map(user => ({
        userId: user.userId,
        emoji: user.emoji,
        displayName: user.displayName,
        connected: true, // In REST mode, all tracked users are active
        lastActivity: user.lastActivity ? new Date(user.lastActivity).toLocaleString() : 'Unknown'
      }));
      res.json({ success: true, users });
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Kick a user from the chat
  app.post("/api/admin/kick-user", authenticateAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const user = connectedUsers.get(userId);
      
      if (user) {
        // Send disconnect message to user before closing
        // user.ws.send(JSON.stringify({
        //   type: "admin_disconnect",
        //   message: "You have been disconnected by an administrator"
        // }));
        
        // Close connection and remove user
        // user.ws.close();
        connectedUsers.delete(userId);
        
        res.json({ success: true, message: "User kicked successfully" });
      } else {
        res.status(404).json({ success: false, message: "User not found or not connected" });
      }
    } catch (error) {
      console.error("Admin kick user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Change admin password
  app.post("/api/admin/change-admin-password", authenticateAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Password cannot be empty" });
      }
      
      if (newPassword.trim().length < 4) {
        return res.status(400).json({ success: false, message: "Password must be at least 4 characters long" });
      }
      
      await saveAdminConfig({ adminPassword: newPassword.trim() });
      res.json({ success: true, message: "Admin password updated successfully. Please log in again with the new password." });
    } catch (error) {
      console.error("Admin change admin password error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Get current room settings
  app.get("/api/admin/room-info", authenticateAdmin, async (req, res) => {
    try {
      const roomInfo = await storage.getRoomInfo();
      const userCount = connectedUsers.size;
      
      res.json({ 
        success: true, 
        room: roomInfo,
        connectedUserCount: userCount
      });
    } catch (error) {
      console.error("Admin get room info error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
}