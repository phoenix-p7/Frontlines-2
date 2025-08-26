// Admin password (from admin-config.json)
const ADMIN_PASSWORD = 'Prathamesh_xaEVA_P7';

// Netlify function handler
export const handler = async (event: any, context: any) => {
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
    const { password } = JSON.parse(event.body || '{}');
    
    if (password === ADMIN_PASSWORD) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, token: ADMIN_PASSWORD }),
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid admin password" }),
      };
    }
  } catch (error) {
    console.error("Admin login function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
}