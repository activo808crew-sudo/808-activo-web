import pool from '../db.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM streamers ORDER BY is_live DESC, created_at ASC');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error listing streamers:', error);
        return res.status(500).json({ error: 'Database error' });
    }
}
