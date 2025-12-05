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

    const usersData = await usersRes.json();
    const users = usersData.data || [];

    // Fetch streams
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

    // Fetch last videos for offline streamers
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
          console.error(`Failed to fetch video for ${user.login}:`, err);
        }
      }
    }

    // Merge
    const result = logins.map(login => {
      const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());
      if (!user) return null;

      const stream = streams.find(s => s.user_id === user.id);
      const lastVideo = videos[user.id];

      // Determine thumbnail
      let thumbnail = null;
      if (stream?.thumbnail_url) {
        thumbnail = stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360');
      } else if (lastVideo?.thumbnail_url) {
        thumbnail = lastVideo.thumbnail_url.replace('%{width}', '640').replace('%{height}', '360');
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
    }).filter(Boolean);

    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}
