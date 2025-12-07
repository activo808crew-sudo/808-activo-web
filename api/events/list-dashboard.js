import pool from '../db.js';
import { requireAuth } from '../utils/auth.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Require authentication for dashboard
        const user = requireAuth(req);
        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const { section } = req.query;

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
        created_by,
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

        // Staff dashboard shows ALL events (so they can see their pending ones)
        // No additional status filtering needed

        query += ' ORDER BY display_order ASC, created_at DESC';

        const [events] = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            events
        });

    } catch (error) {
        console.error('Dashboard events error:', error);
        return res.status(500).json({ error: 'Error al obtener eventos' });
    }
}
