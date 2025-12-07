import pool from '../db.js';
import { requireAuth } from '../utils/auth.js';

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

        // Fetch fresh user data from database
        const [users] = await pool.query(
            'SELECT id, email, role, verified, created_at FROM staff_users WHERE id = ?',
            [user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const currentUser = users[0];

        // Check if user is still verified
        if (!currentUser.verified) {
            return res.status(403).json({ error: 'Email no verificado' });
        }

        // Return user profile
        return res.status(200).json({
            success: true,
            user: {
                id: currentUser.id,
                email: currentUser.email,
                role: currentUser.role,
                verified: currentUser.verified,
                createdAt: currentUser.created_at
            }
        });

    } catch (error) {
        console.error('Auth check error:', error);
        return res.status(500).json({ error: 'Error al verificar autenticación' });
    }
}
