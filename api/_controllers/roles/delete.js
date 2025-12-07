import pool from '../../db.js';
import { requireAuth, requireRole } from '../../utils/auth.js';
import { logAction } from '../../utils/audit.js';

export default async function handler(req, res) {
    // Only allow DELETE requests
    if (req.method !== 'DELETE') {
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
                error: 'Solo el Owner puede eliminar usuarios'
            });
        }

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'ID de usuario requerido' });
        }

        if (parseInt(id) === user.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // Get target user info for logging
        const [targets] = await pool.query('SELECT email, role FROM staff_users WHERE id = ?', [id]);

        if (targets.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const targetUser = targets[0];

        // Perform deletion
        await pool.query('DELETE FROM staff_users WHERE id = ?', [id]);

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await logAction(pool, user.id, 'DELETE_USER', {
            target_id: id,
            target_email: targetUser.email,
            target_role: targetUser.role
        }, ip);

        return res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
}
