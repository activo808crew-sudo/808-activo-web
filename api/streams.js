export default async function handler(req, res) {
  try {
    // use env vars or fallbacks (note: embedding secrets is insecure for public repos)
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID || "5awflirnp3ns3gn0z627q66ot0pc0j";
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "938ejrbuxwuqh1pz9fb2muo33lvyzk";

    // Allow using a pre-provided token from environment (VITE_TWITCH_TOKEN) for dev convenience
    // prefer explicit VITE_TWITCH_TOKEN and VITE_TWITCH_CLIENT_ID if present
    const envToken = process.env.VITE_TWITCH_TOKEN || process.env.TWITCH_TOKEN || null;
    const envClientId = process.env.VITE_TWITCH_CLIENT_ID || process.env.TWITCH_CLIENT_ID || null;
    if (envClientId) {
      // override CLIENT_ID if a specific env var is provided
      // (useful when .env defines VITE_TWITCH_CLIENT_ID)
      // keep CLIENT_SECRET only for server-side token requests
      // eslint-disable-next-line no-unused-vars
      // CLIENT_ID = envClientId; // keep const, so use local binding instead
    }

    let accessToken = envToken;
    const effectiveClientId = envClientId || CLIENT_ID;

    if (!accessToken) {
      // obtain app access token server-side using client secret
      const tokenUrl = `https://id.twitch.tv/oauth2/token`;
      const tokenRes = await fetch(`${tokenUrl}?client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&grant_type=client_credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        console.error('Token request failed:', tokenRes.status, text);
        return res.status(502).json({ error: 'Failed obtaining Twitch token', status: tokenRes.status, body: text });
      }
      const tokenJson = await tokenRes.json();
      accessToken = tokenJson?.access_token;
      if (!accessToken) return res.status(502).json({ error: 'No access_token from Twitch' });
    }

    // parse logins from query or use defaults
    const { logins } = req.query || {};
    let loginArr = [];
    if (logins) {
      loginArr = String(logins).split(',').map(s => s.trim()).filter(Boolean);
    }
    if (loginArr.length === 0) {
      loginArr = ['MissiFussa', 'Yaqz29', 'Parzival', 'valesuki___', 'ladycherryblack'];
    }

    // 1) Get users
    const usersQuery = loginArr.map(login => `login=${encodeURIComponent(login)}`).join('&');
    const usersRes = await fetch(`https://api.twitch.tv/helix/users?${usersQuery}`, {
      headers: {
        'Client-ID': effectiveClientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!usersRes.ok) {
      const text = await usersRes.text();
      console.error('Helix users failed:', usersRes.status, text);
      return res.status(usersRes.status).json({ error: 'Failed fetching users', status: usersRes.status, body: text });
    }
    const usersJson = await usersRes.json();
    const users = Array.isArray(usersJson.data) ? usersJson.data : [];

    // 2) Get live streams for these user ids
    const idsQuery = users.map(u => `user_id=${u.id}`).join('&');
    let streamsJson = { data: [] };
    if (idsQuery) {
      const streamsRes = await fetch(`https://api.twitch.tv/helix/streams?${idsQuery}`, {
        headers: {
          'Client-ID': effectiveClientId,
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (streamsRes.ok) {
        streamsJson = await streamsRes.json();
      } else {
        console.warn('Helix streams fetch failed:', streamsRes.status);
      }
    }

    // 3) Get channel info for all users (description)
    const channelInfoMap = {};
    if (users.length > 0) {
      const channelIds = users.map(u => `broadcaster_id=${u.id}`).join('&');
      try {
        const channelRes = await fetch(`https://api.twitch.tv/helix/channels?${channelIds}`, {
          headers: {
            'Client-ID': effectiveClientId,
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (channelRes.ok) {
          const channelJson = await channelRes.json();
          if (Array.isArray(channelJson.data)) {
            channelJson.data.forEach(ch => {
              channelInfoMap[ch.broadcaster_id] = ch;
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch channel info:', e);
      }
    }

    // 4) Get last video/VOD for offline users to determine last stream time
    const videoMap = {};
    for (const u of users) {
      const live = streamsJson.data.find(s => String(s.user_id) === String(u.id));
      if (!live) {
        // User is offline, fetch their latest video
        try {
          const videoRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${u.id}&first=1&type=archive`, {
            headers: {
              'Client-ID': effectiveClientId,
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (videoRes.ok) {
            const videoJson = await videoRes.json();
            if (Array.isArray(videoJson.data) && videoJson.data.length > 0) {
              videoMap[u.id] = videoJson.data[0];
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch videos for ${u.login}:`, e);
        }
      }
    }

    // merge
    const merged = loginArr.map(login => {
      const u = users.find(x => String(x.login).toLowerCase() === String(login).toLowerCase());
      if (!u) return { login, name: login, url: `https://twitch.tv/${login}`, status: 'offline' };

      const live = streamsJson.data.find(s => String(s.user_id) === String(u.id));
      const channelInfo = channelInfoMap[u.id];
      const lastVideo = videoMap[u.id];

      let thumbnail = null;
      if (live?.thumbnail_url) {
        // If live, use the live stream thumbnail
        thumbnail = String(live.thumbnail_url).replace('{width}', '640').replace('{height}', '360');
      } else if (lastVideo?.thumbnail_url) {
        // If offline but has a last video, use that thumbnail
        thumbnail = String(lastVideo.thumbnail_url).replace('%{width}', '640').replace('%{height}', '360');
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
        description: u.description || channelInfo?.title || null,
        lastStreamDate: lastVideo?.created_at || null,
      };
    });

    return res.status(200).json({ data: merged });
  } catch (err) {
    console.error('Error in /api/streams:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
