import pool from '../db.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { logAction } from '../utils/audit.js';

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

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'ID de evento requerido' });
        }

        // Check if event exists
        const [events] = await pool.query(
            'SELECT id, title, status FROM events WHERE id = ?',
            [id]
        );

        if (events.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        const event = events[0];
        const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

        // Role-based deletion logic
        if (requireRole(user, ['director', 'owner'])) {
            // Directors and Owners can delete directly
            await pool.query(
                'UPDATE events SET is_active = FALSE WHERE id = ?',
                [id]
            );

            await logAction(pool, user.id, 'DELETE_EVENT', { id, title: event.title }, ip);

            return res.status(200).json({
                success: true,
                message: 'Evento eliminado exitosamente'
            });
        } else {
            // Staff users request deletion (change status to pending_deletion)
            await pool.query(
                'UPDATE events SET status = ? WHERE id = ?',
                ['pending_deletion', id]
            );

            await logAction(pool, user.id, 'REQUEST_DELETE_EVENT', {
                id,
                title: event.title,
                oldStatus: event.status,
                newStatus: 'pending_deletion'
            }, ip);

            return res.status(200).json({
                success: true,
                message: 'Solicitud de eliminación enviada. Requiere aprobación de Director/Owner',
                isPending: true
            });
        }

    } catch (error) {
        console.error('Event deletion error:', error);
        return res.status(500).json({
            error: 'Error al procesar solicitud',
            details: error.message
        });
    }
}
