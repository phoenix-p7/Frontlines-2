import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    const { emoji, displayName, password } = JSON.parse(event.body || '{}');

    // Validate password
    if (password !== "unite-sovereign100lx") {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid password" }),
      };
    }

    // Generate unique user ID
    const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const user = {
      emoji,
      displayName,
      userId
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, user }),
    };
  } catch (error) {
    console.error("Join function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
};