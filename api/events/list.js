import pool from '../db.js';
import { requireAuth, requireRole } from '../utils/auth.js';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { section } = req.query;

        // Try to get user info if authenticated (optional for this endpoint)
        const user = requireAuth(req);

        let query = `
      SELECT 
        id,
        title,
        description,
        badge,
        badge_color as badgeColor,
        image_url as image,
        gradient,
        section,
        display_order,
        status,
        status,
        created_at,
        start_date,
        start_time,
        recurrence
      FROM events
      WHERE is_active = TRUE
    `;

        const params = [];

        // Filter by section if provided
        if (section && ['main', 'minecraft'].includes(section)) {
            query += ' AND section = ?';
            params.push(section);
        }

        // Filter based on user role:
        // - No auth or staff: only see published events
        // - Director/Owner: see all events (published + pending for approval)
        if (!user || !requireRole(user, ['director', 'owner'])) {
            query += ' AND status = ?';
            params.push('published');
        }

        query += ' ORDER BY display_order ASC, created_at DESC';

        const [events] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Events list error:', error);
        return res.status(500).json({ error: 'Error al obtener eventos' });
    }
}
