// Vercel Serverless Function
module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing credentials:', { CLIENT_ID: !!CLIENT_ID, CLIENT_SECRET: !!CLIENT_SECRET });
      return res.status(500).json({ error: 'Missing Twitch credentials' });
    }

    // Get access token
    const tokenUrl = 'https://id.twitch.tv/oauth2/token';
    const tokenRes = await fetch(`${tokenUrl}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
      method: 'POST'
    });

    if (!tokenRes.ok) {
      console.error('Token request failed:', tokenRes.status);
      return res.status(502).json({ error: 'Failed to get Twitch token' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Parse query
    const logins = req.query.logins || 'MissiFussa,Yaqz29,parzival016,valesuki___,ladycherryblack';
    const loginArr = logins.split(',').map(s => s.trim());

    // Get users
    const usersQuery = loginArr.map(login => `login=${encodeURIComponent(login)}`).join('&');
    const usersRes = await fetch(`https://api.twitch.tv/helix/users?${usersQuery}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!usersRes.ok) {
      console.error('Users request failed:', usersRes.status);
      return res.status(502).json({ error: 'Failed to fetch users' });
    }

    const usersData = await usersRes.json();
    const users = usersData.data || [];

    // Get streams
    const idsQuery = users.map(u => `user_id=${u.id}`).join('&');
    let streamsData = { data: [] };

    if (idsQuery) {
      const streamsRes = await fetch(`https://api.twitch.tv/helix/streams?${idsQuery}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (streamsRes.ok) {
        streamsData = await streamsRes.json();
      }
    }

    // Merge data
    const merged = loginArr.map(login => {
      const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());
      if (!user) return null;

      const stream = streamsData.data.find(s => s.user_id === user.id);

      return {
        id: user.id,
        login: user.login,
        name: user.display_name,
        avatar: user.profile_image_url,
        url: `https://twitch.tv/${user.login}`,
        status: stream ? 'live' : 'offline',
        game: stream?.game_name || null,
        title: stream?.title || null,
        thumbnail: stream?.thumbnail_url?.replace('{width}', '640').replace('{height}', '360'),
        viewers: stream?.viewer_count || 0,
        description: user.description
      };
    }).filter(Boolean);

    return res.status(200).json({ data: merged });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
