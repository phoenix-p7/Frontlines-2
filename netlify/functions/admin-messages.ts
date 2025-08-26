import type { Handler } from '@netlify/functions';
import { storage } from '../../server/storage';

// Admin authentication middleware
function isAuthorized(event: any): boolean {
  const authHeader = event.headers.authorization;
  // You can change this to your admin password
  return authHeader === 'Bearer Prathamesh_xaEVA_P7';
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check authorization
  if (!isAuthorized(event)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, message: "Unauthorized admin access" }),
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get all messages with reactions
      const messages = await storage.getMessages();
      const messagesWithReactions = await Promise.all(
        messages.map(async (message: any) => {
          const reactions = await storage.getMessageReactions(message.id);
          return { ...message, reactions };
        })
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, messages: messagesWithReactions }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Delete a specific message
      const pathParts = event.path.split('/');
      const messageId = parseInt(pathParts[pathParts.length - 1]);
      
      if (isNaN(messageId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Invalid message ID' }),
        };
      }

      await storage.deleteMessage(messageId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: "Message deleted successfully" }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error("Admin messages function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
};