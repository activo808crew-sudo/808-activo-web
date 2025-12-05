export default async function handler(req, res) {
  try {
    // NOTE: Using embedded credentials is insecure for public repos.
    // These fallbacks are added per user request; prefer setting the env vars instead.
    const CLIENT_ID = process.env.TWITCH_CLIENT_ID || "5awflirnp3ns3gn0z627q66ot0pc0j";
    const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "938ejrbuxwuqh1pz9fb2muo33lvyzk";

    const tokenUrl = `https://id.twitch.tv/oauth2/token`;
    const response = await fetch(`${tokenUrl}?client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&grant_type=client_credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    console.error("Error obteniendo token:", err);
    return res.status(500).json({ error: "Error al obtener token" });
  }
}
