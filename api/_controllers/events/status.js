import pool from '../../_db.js';
import { requireAuth, requireRole } from '../../_utils/auth.js';
import { logAction } from '../../_utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = requireAuth(req);
        if (!user) return res.status(401).json({ error: 'No autenticado' });

        if (!requireRole(user, ['director', 'owner'])) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { eventId, action } = req.body; // action: 'approve', 'reject', 'delete', 'restore'

        if (!eventId || !['approve', 'reject', 'delete', 'restore'].includes(action)) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        // Check if event exists
        const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });

        const event = rows[0];
        let newStatus;
        let actionDescription;

        // Handle different actions
        switch (action) {
            case 'approve':
                newStatus = 'published';
                actionDescription = 'aprobado';
                break;
            case 'reject':
                newStatus = 'rejected';
                actionDescription = 'rechazado';
                break;
            case 'delete':
                // Actually delete the event (soft delete)
                await pool.query('UPDATE events SET is_active = FALSE WHERE id = ?', [eventId]);

                const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
                await logAction(pool, user.id, 'APPROVE_DELETE_EVENT', {
                    id: eventId,
                    title: event.title,
                    previousStatus: event.status
                }, ip);

                return res.status(200).json({
                    success: true,
                    message: 'Evento eliminado exitosamente'
                });
            case 'restore':
                newStatus = 'published';
                actionDescription = 'restaurado';
                break;
        }

        // Update status for approve/reject/restore actions
        await pool.query('UPDATE events SET status = ? WHERE id = ?', [newStatus, eventId]);

        //Log
        const ip2 = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress);
        await logAction(pool, user.id, 'REVIEW_EVENT', {
            event_id: eventId,
            title: event.title,
            old_status: event.status,
            new_status: newStatus,
            action: actionDescription
        }, ip2);

        res.json({ success: true, message: `Evento ${actionDescription}` });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error interno' });
    }
}

