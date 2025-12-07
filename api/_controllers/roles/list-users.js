import pool from '../../_db.js';
import { requireAuth, requireRole } from '../../_utils/auth.js';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify JWT token
        const user = requireAuth(req);

        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Check if user is owner
        if (!requireRole(user, ['owner'])) {
            return res.status(403).json({
                error: 'Solo el Owner puede ver todos los usuarios'
            });
        }

        // Fetch all staff users (excluding passwords)
        const [staffUsers] = await pool.query(
            `SELECT 
        id,
        email,
        role,
        verified,
        created_at,
        updated_at
       FROM staff_users
       ORDER BY 
         CASE role
           WHEN 'owner' THEN 1
           WHEN 'director' THEN 2
           WHEN 'staff' THEN 3
         END,
         created_at DESC`
        );

        return res.status(200).json({
            success: true,
            users: staffUsers
        });

    } catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
}

