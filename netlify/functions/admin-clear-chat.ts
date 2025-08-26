import type { Handler } from '@netlify/functions';
import { storage } from '../../server/storage';

// Admin authentication middleware
function isAuthorized(event: any): boolean {
  const authHeader = event.headers.authorization;
  return authHeader === 'Bearer Prathamesh_xaEVA_P7';
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
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
    await storage.clearAllMessages();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Chat history cleared successfully" }),
    };
  } catch (error) {
    console.error("Admin clear chat function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
};