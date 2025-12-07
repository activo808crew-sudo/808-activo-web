import pool from './db.js';

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
    // 1. Determine logins (from Query or DB)
    let logins = [];
    if (req.query.logins) {
      logins = req.query.logins.split(',').map(s => s.trim());
    } else {
      try {
        const [rows] = await pool.query('SELECT channel_id FROM streamers WHERE platform = "twitch"');
        logins = rows.map(r => r.channel_id);
      } catch (dbErr) {
        console.error("DB Error fetching streamers:", dbErr);
        // If DB fails and no query, we can't do anything
      }
    }

    console.log('[DEBUG] Streamers to process:', logins.length, logins);

    if (logins.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Default fallback generator
    const createFallbackData = (loginList) => loginList.map(l => ({
      id: `fallback-${l}`,
      login: l,
      name: l,
      avatar: null, // Frontend should handle null avatar
      url: `https://twitch.tv/${l}`,
      status: 'offline',
      game: null,
      title: 'Streamer Configurado',
      thumbnail: null,
      viewers: 0,
      description: 'Detalles no disponibles (API Error/Missing)',
      lastStreamDate: null
    }));

    const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

    // 2. Check Credentials
    console.log('[DEBUG] Twitch API Check:', { hasClientId: !!CLIENT_ID, hasSecret: !!CLIENT_SECRET });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log('[DEBUG] Missing credentials - Returning fallback data');
      return res.status(200).json({ data: createFallbackData(logins) });
    }

    // 3. Get Token
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );

    if (!tokenRes.ok) {
      console.log('[DEBUG] Token failed:', tokenRes.status, '- Returning fallback data');
      return res.status(200).json({ data: createFallbackData(logins) });
    }

    const { access_token } = await tokenRes.json();

    // 4. Fetch Users
    const usersQuery = logins.map(l => `login=${encodeURIComponent(l)}`).join('&');
    const usersRes = await fetch(`https://api.twitch.tv/helix/users?${usersQuery}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!usersRes.ok) {
      console.log('[DEBUG] Users fetch failed - Returning fallback data');
      return res.status(200).json({ data: createFallbackData(logins) });
    }

    const usersData = await usersRes.json();
    const users = usersData.data || [];

    // 5. Fetch Streams
    const idsQuery = users.map(u => `user_id=${u.id}`).join('&');
    let streams = [];

    if (idsQuery) {
      const streamsRes = await fetch(`https://api.twitch.tv/helix/streams?${idsQuery}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (streamsRes.ok) {
        const data = await streamsRes.json();
        streams = data.data || [];
      }
    }

    // 6. Fetch Videos (Optional - skipped if error)
    const videos = {};
    for (const user of users) {
      const isLive = streams.find(s => s.user_id === user.id);
      if (!isLive) {
        try {
          const videoRes = await fetch(
            `https://api.twitch.tv/helix/videos?user_id=${user.id}&first=1&type=archive`,
            {
              headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${access_token}`
              }
            }
          );

          if (videoRes.ok) {
            const videoData = await videoRes.json();
            if (videoData.data && videoData.data.length > 0) {
              videos[user.id] = videoData.data[0];
            }
          }
        } catch (err) {
          // Ignore video fetch errors
        }
      }
    }

    // 7. Merge Data & Update DB
    const result = await Promise.all(logins.map(async login => {
      const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());
      // If user not found in Twitch, return fallback for that specific user
      if (!user) return createFallbackData([login])[0];

      const stream = streams.find(s => s.user_id === user.id);
      const lastVideo = videos[user.id];

      let thumbnail = null;
      if (stream?.thumbnail_url) {
        thumbnail = stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360');
      } else if (lastVideo?.thumbnail_url) {
        thumbnail = lastVideo.thumbnail_url.replace('%{width}', '640').replace('%{height}', '360');
      }

      // Check previous status in DB to trigger notification
      const isLiveNow = !!stream;
      try {
        const [dbRows] = await pool.query('SELECT is_live FROM streamers WHERE channel_id = ?', [login]);
        if (dbRows.length > 0) {
          const wasLive = dbRows[0].is_live;
          // If JUST went live (Offline -> Live)
          if (isLiveNow && !wasLive) {
            console.log(`[Streamer] ${login} just went ONLINE! Sending notification...`);
            // Dynamic import to avoid top-level await issues if any, though standard import works 
            const { sendDiscordWebhook } = await import('./utils/discord.js');
            await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_STREAMERS, {
              content: `<@&1310103738012074055> **${user.display_name}** está en directo! 🔴\nhttps://twitch.tv/${user.login}`,
              embeds: [{
                title: stream.title || 'Live Stream',
                description: `Jugando **${stream.game_name || 'Varios'}**`,
                url: `https://twitch.tv/${user.login}`,
                color: 0x9146FF,
                image: { url: thumbnail + `?t=${Date.now()}` },
                thumbnail: { url: user.profile_image_url },
                footer: { text: '808 Activo • Streamers' },
                timestamp: new Date().toISOString()
              }]
            });
            // Update DB
            await pool.query('UPDATE streamers SET is_live = TRUE, last_live_at = NOW() WHERE channel_id = ?', [login]);
          } else if (!isLiveNow && wasLive) {
            // Went Offline
            await pool.query('UPDATE streamers SET is_live = FALSE WHERE channel_id = ?', [login]);
          }
        }
      } catch (err) {
        console.error(`[Streamer] Error updating status for ${login}:`, err);
      }

      return {
        id: user.id,
        login: user.login,
        name: user.display_name,
        avatar: user.profile_image_url,
        url: `https://twitch.tv/${user.login}`,
        status: stream ? 'live' : 'offline',
        game: stream?.game_name || null,
        title: stream?.title || null,
        thumbnail,
        viewers: stream?.viewer_count || 0,
        description: user.description,
        lastStreamDate: lastVideo?.created_at || null
      };
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error('API Streams Error:', error);
    // Even in total failure, try to return something if we have logins
    /* 
       Problem: if we are in catch block, 'logins' might be defined or undefined depending on where it failed.
       Safe to just return 500 here since we tried our best with fallbacks above.
    */
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}
