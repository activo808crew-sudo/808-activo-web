import pool from '../db.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { validateRole } from '../utils/validation.js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify JWT token
        const user = requireAuth(req);

        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Check if user is owner (only owners can designate directors)
        if (!requireRole(user, ['owner'])) {
            return res.status(403).json({
                error: 'Solo el Owner puede designar Staff Directors'
            });
        }

        const { userId, newRole } = req.body;

        // Validate input
        if (!userId || !newRole) {
            return res.status(400).json({
                error: 'userId y newRole son requeridos'
            });
        }

        // Validate role
        if (!validateRole(newRole) || newRole === 'owner') {
            return res.status(400).json({
                error: 'Rol inválido. Solo se puede asignar "director" o "staff"'
            });
        }

        // Check if target user exists
        const [users] = await pool.query(
            'SELECT id, email, role FROM staff_users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const targetUser = users[0];

        // Don't allow changing owner role
        if (targetUser.role === 'owner') {
            return res.status(403).json({
                error: 'No se puede cambiar el rol del Owner'
            });
        }

        // Update user role
        await pool.query(
            'UPDATE staff_users SET role = ? WHERE id = ?',
            [newRole, userId]
        );

        return res.status(200).json({
            success: true,
            message: `Rol actualizado a ${newRole} exitosamente`,
            user: {
                id: targetUser.id,
                email: targetUser.email,
                role: newRole
            }
        });

    } catch (error) {
        console.error('Role designation error:', error);
        return res.status(500).json({ error: 'Error al designar rol' });
    }
}
