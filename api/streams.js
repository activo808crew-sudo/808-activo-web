// Vercel Serverless Function - Twitch Streams
module.exports = async (req, res) => {
  console.log('=== API /streams called ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 200');
    res.status(200).end();
    return;
  }

  try {
    // Check environment variables
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

    console.log('Environment check:', {
      hasClientId: !!CLIENT_ID,
      hasClientSecret: !!CLIENT_SECRET,
      clientIdLength: CLIENT_ID?.length || 0,
      clientSecretLength: CLIENT_SECRET?.length || 0
    });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('Missing Twitch credentials');
      return res.status(500).json({
        error: 'Missing Twitch credentials',
        details: {
          hasClientId: !!CLIENT_ID,
          hasClientSecret: !!CLIENT_SECRET
        }
      });
    }

    // Get access token
    console.log('Requesting Twitch token...');
    const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`;

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Token response status:', tokenRes.status);

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('Token request failed:', {
        status: tokenRes.status,
        error: errorText
      });
      return res.status(502).json({
        error: 'Failed to get Twitch token',
        status: tokenRes.status,
        details: errorText
      });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    console.log('Token obtained successfully');

    // Parse query
    const logins = req.query.logins || 'MissiFussa,Yaqz29,parzival016,valesuki___,ladycherryblack';
    const loginArr = logins.split(',').map(s => s.trim());
    console.log('Fetching data for logins:', loginArr);

    // Get users
    const usersQuery = loginArr.map(login => `login=${encodeURIComponent(login)}`).join('&');
    const usersRes = await fetch(`https://api.twitch.tv/helix/users?${usersQuery}`, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Users response status:', usersRes.status);

    if (!usersRes.ok) {
      const errorText = await usersRes.text();
      console.error('Users request failed:', {
        status: usersRes.status,
        error: errorText
      });
      return res.status(502).json({
        error: 'Failed to fetch users',
        status: usersRes.status,
        details: errorText
      });
    }

    const usersData = await usersRes.json();
    const users = usersData.data || [];
    console.log('Users fetched:', users.length);

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

      console.log('Streams response status:', streamsRes.status);

      if (streamsRes.ok) {
        streamsData = await streamsRes.json();
        console.log('Streams fetched:', streamsData.data?.length || 0);
      } else {
        console.warn('Streams request failed but continuing');
      }
    }

    // Merge data
    const merged = loginArr.map(login => {
      const user = users.find(u => u.login.toLowerCase() === login.toLowerCase());
      if (!user) {
        console.warn('User not found:', login);
        return null;
      }

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

    console.log('Returning data for', merged.length, 'streamers');
    return res.status(200).json({ data: merged });
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
