import type { Handler } from '@netlify/functions';
import { storage } from '../../server/storage';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Get all messages
      const messages = await storage.getMessages();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, messages }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Send a message
      const { emoji, displayName, message, userId, replyToId, replyToMessage, replyToDisplayName } = JSON.parse(event.body || '{}');
      
      const newMessage = await storage.saveMessage({
        emoji,
        displayName,
        message,
        userId: userId || displayName, // Use displayName as fallback userId
        replyToId,
        replyToMessage,
        replyToDisplayName
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: newMessage }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Messages function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' }),
    };
  }
};