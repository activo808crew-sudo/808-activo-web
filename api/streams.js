// Vercel Serverless Function para Twitch Streams
export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Obtener credenciales de variables de entorno
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Missing Twitch credentials in environment variables'
      });
    }

    // Obtener token de acceso
    let accessToken = process.env.VITE_TWITCH_TOKEN;

    if (!accessToken) {
      const tokenUrl = 'https://id.twitch.tv/oauth2/token';
      const tokenRes = await fetch(`${tokenUrl}?client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&grant_type=client_credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        console.error('Token request failed:', tokenRes.status, text);
        return res.status(502).json({ error: 'Failed obtaining Twitch token', status: tokenRes.status });
      }

      const tokenJson = await tokenRes.json();
      accessToken = tokenJson?.access_token;

      if (!accessToken) {
        return res.status(502).json({ error: 'No access_token from Twitch' });
      }
    }

    // Parse logins from query
    const { logins } = req.query || {};
    let loginArr = [];

    if (logins) {
      loginArr = String(logins).split(',').map(s => s.trim()).filter(Boolean);
    }

    if (loginArr.length === 0) {
      loginArr = ['MissiFussa', 'Yaqz29', 'parzival016', 'valesuki___', 'ladycherryblack'];
    }

    // 1) Get users
    const usersQuery = loginArr.map(login => `login=${encodeURIComponent(login)}`).join('&');
    const usersRes = await fetch(`https://api.twitch.tv/helix/users?${usersQuery}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!usersRes.ok) {
      const text = await usersRes.text();
      console.error('Helix users failed:', usersRes.status, text);
      return res.status(usersRes.status).json({ error: 'Failed fetching users', status: usersRes.status });
    }

    const usersJson = await usersRes.json();
    const users = Array.isArray(usersJson.data) ? usersJson.data : [];

    // 2) Get live streams
    const idsQuery = users.map(u => `user_id=${u.id}`).join('&');
    let streamsJson = { data: [] };

    if (idsQuery) {
      const streamsRes = await fetch(`https://api.twitch.tv/helix/streams?${idsQuery}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (streamsRes.ok) {
        streamsJson = await streamsRes.json();
      } else {
        console.warn('Helix streams fetch failed:', streamsRes.status);
      }
    }

    // 3) Merge data
    const merged = loginArr.map(login => {
      const u = users.find(x => String(x.login).toLowerCase() === String(login).toLowerCase());
      if (!u) return { login, name: login, url: `https://twitch.tv/${login}`, status: 'offline' };

      const live = streamsJson.data.find(s => String(s.user_id) === String(u.id));

      let thumbnail = null;
      if (live?.thumbnail_url) {
        thumbnail = String(live.thumbnail_url).replace('{width}', '640').replace('{height}', '360');
      }

      return {
        id: String(u.id),
        login: u.login,
        name: u.display_name || u.login,
        avatar: u.profile_image_url || null,
        url: `https://twitch.tv/${u.login}`,
        status: live ? 'live' : 'offline',
        game: live?.game_name || null,
        title: live?.title || null,
        thumbnail,
        viewers: live?.viewer_count ? Number(live.viewer_count) : 0,
        description: u.description || null,
      };
    });

    return res.status(200).json({ data: merged });
  } catch (err) {
    console.error('Error in /api/streams:', err);
    return res.status(500).json({ error: 'Internal error', message: err.message });
  }
}
