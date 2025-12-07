import pool from '../../_db.js';
import { requireAuth } from '../../_utils/auth.js';
import { logAction } from '../../_utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth Check
    const user = requireAuth(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, platform, channel_id, image_url, description } = req.body;

    if (!name || !platform || !channel_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO streamers (name, platform, channel_id, image_url, description, created_by) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, platform, channel_id, image_url, description, user.id]
        );

        const newId = result.insertId;

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
        await logAction(connection, user.id, 'CREATE_STREAMER', { id: newId, name, platform }, ip);

        await connection.commit();

        return res.status(201).json({
            message: 'Streamer created successfully',
            id: newId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating streamer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Streamer channel ID already exists' });
        }
        return res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
}

