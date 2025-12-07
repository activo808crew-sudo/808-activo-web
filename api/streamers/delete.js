import pool from '../db.js';
import { requireAuth } from '../utils/auth.js';
import { logAction } from '../utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth Check
    const user = requireAuth(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.query.id || req.body.id;

    if (!id) {
        return res.status(400).json({ error: 'Missing streamer ID' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Get Name for audit
        const [rows] = await connection.query('SELECT name FROM streamers WHERE id = ?', [id]);
        if (rows.length === 0) {
            await connection.commit();
            return res.status(404).json({ error: 'Streamer not found' });
        }
        const streamerName = rows[0].name;

        // Delete
        await connection.query('DELETE FROM streamers WHERE id = ?', [id]);

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
        await logAction(connection, user.id, 'DELETE_STREAMER', { id, name: streamerName }, ip);

        await connection.commit();

        return res.status(200).json({ message: 'Streamer deleted successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting streamer:', error);
        return res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
}
