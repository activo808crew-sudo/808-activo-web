// Vercel Serverless Function - Tebex Top Donor Proxy
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Fetch from Tebex - this bypasses CORS since it's server-side
        const tebexRes = await fetch('https://plugin.tebex.io/community/top_donators', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!tebexRes.ok) {
            return res.status(tebexRes.status).json({ error: 'Tebex request failed' });
        }

        const data = await tebexRes.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            error: 'Server error',
            message: error.message
        });
    }
}
