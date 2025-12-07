import pool from '../../_db.js';
import { requireAuth } from '../../_utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth Check - Only Owner and Director
    const user = requireAuth(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Optional: Restrict to owner only? Or Director too?
    // Plan said Owner/Director.
    if (user.role !== 'owner' && user.role !== 'director') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const [rows] = await pool.query(`
            SELECT a.*, u.email as user_email, u.role as user_role 
            FROM audit_logs a
            LEFT JOIN staff_users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 100
        `);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error listing audit logs:', error);
        return res.status(500).json({
            error: 'Database error',
            details: error.message,
            stack: error.stack
        });
    }
}

