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

        // Check if user has required role (director or owner)
        if (!requireRole(user, ['director', 'owner'])) {
            return res.status(403).json({
                error: 'No tienes permisos para ver las claves de staff'
            });
        }

        // Fetch all staff keys with related user information
        const [staffKeys] = await pool.query(
            `SELECT 
        sk.id,
        sk.key_value,
        sk.is_used,
        sk.expires_at,
        sk.created_at,
        sk.used_at,
        creator.email as created_by_email,
        user.email as used_by_email,
        CASE
          WHEN sk.is_used THEN 'used'
          WHEN sk.expires_at < NOW() THEN 'expired'
          ELSE 'active'
        END as status
       FROM staff_keys sk
       LEFT JOIN staff_users creator ON sk.created_by = creator.id
       LEFT JOIN staff_users user ON sk.used_by = user.id
       ORDER BY sk.created_at DESC`
        );

        return res.status(200).json({
            success: true,
            staffKeys
        });

    } catch (error) {
        console.error('Staff keys list error:', error);
        return res.status(500).json({ error: 'Error al obtener las claves' });
    }
}

