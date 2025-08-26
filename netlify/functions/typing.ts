import type { Handler } from '@netlify/functions';

// In-memory storage for typing users (since typing is temporary)
// Note: In serverless, this will reset on each function invocation
// For production, you'd use Redis or similar
const typingUsers = new Map<string, {
  emoji: string;
  displayName: string;
  userId: string;
  lastUpdate: number;
}>();

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
    if (event.httpMethod === 'POST') {
      // Set typing status
      const { emoji, displayName, userId, isTyping } = JSON.parse(event.body || '{}');
      
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
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (event.httpMethod === 'GET') {
      // Get typing users
      const activeTypingUsers = Array.from(typingUsers.values()).filter(user => {
        const now = Date.now();
        return (now - user.lastUpdate) < 3000; // Only show users who were typing within last 3 seconds
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, typingUsers: activeTypingUsers }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Typing function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error' }),
    };
  }
};