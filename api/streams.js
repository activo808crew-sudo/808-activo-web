// Runtime configuration for Vercel
export const config = {
  runtime: 'nodejs',
};

// Vercel Serverless Function - Twitch Streams
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Missing credentials',
        env: {
          hasClientId: !!CLIENT_ID,
          hasSecret: !!CLIENT_SECRET
        }
      });
    }

    // Get token
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!tokenRes.ok) {
      return res.status(502).json({ error: 'Token failed', status: tokenRes.status });
    }

    const { access_token } = await tokenRes.json();

    // Get logins
    const logins = (req.query.logins || 'MissiFussa,Yaqz29,parzival016,valesuki___,ladycherryblack')
      .split(',')
      .map(s => s.trim());

    // Fetch users
    const usersQuery = logins.map(l => `login=${encodeURIComponent(l)}`).join('&');
    const usersRes = await fetch(`https://api.twitch.tv/helix/users?${usersQuery}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!usersRes.ok) {
      return res.status(502).json({ error: 'Users failed', status: usersRes.status });
    }

    error: 'Server error',
      message: error.message
  });
}
}
