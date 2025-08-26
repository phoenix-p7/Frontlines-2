// Netlify function for message reactions
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { messageReactions } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import ws from "ws";

// Initialize database connection for Netlify
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

export const handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let messageId: number;
    
    if (event.httpMethod === 'GET') {
      // For GET requests, messageId is in query parameters
      messageId = parseInt(event.queryStringParameters?.messageId || '0');
    } else {
      // For POST/DELETE requests, messageId is in the request body
      const { messageId: bodyMessageId } = JSON.parse(event.body || '{}');
      messageId = parseInt(bodyMessageId || '0');
    }

    if (isNaN(messageId) || messageId <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Invalid message ID' }),
      };
    }

    if (event.httpMethod === 'GET') {
      // Get reactions for a message
      const reactions = await db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, reactions }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Add reaction to a message
      const { emoji, userId, displayName } = JSON.parse(event.body || '{}');
      
      // Check if user already reacted with this emoji
      const existingReaction = await db.select().from(messageReactions)
        .where(and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        ));

      if (existingReaction.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'You already reacted with this emoji' }),
        };
      }
      
      // Check if user already has 2 reactions on this message
      const userReactions = await db.select().from(messageReactions)
        .where(and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId)
        ));
      
      if (userReactions.length >= 2) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'You can only add up to 2 reactions per message' }),
        };
      }
      
      await db.insert(messageReactions).values({ messageId, userId, emoji, displayName });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Remove reaction from a message
      const { emoji, userId } = JSON.parse(event.body || '{}');
      
      await db.delete(messageReactions).where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Reactions function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' }),
    };
  }
};