import pool from '../db.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { validateEventData, sanitizeInput } from '../utils/validation.js';
import { logAction } from '../utils/audit.js';

export default async function handler(req, res) {
    // Only allow PUT requests
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify JWT token
        const user = requireAuth(req);

        if (!user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const { id } = req.query;
        const {
            title,
            description,
            badge,
            badge_color,
            image_url,
            gradient,
            section,
            display_order,
            is_active,
            status // Allow direct status update via this endpoint? Prefer separate endpoint, but if passed by admin, ok.
        } = req.body;


        if (!id) {
            return res.status(400).json({ error: 'ID de evento requerido' });
        }

        // Check if event exists (Fetch full data for comparison)
        const [originalEvents] = await pool.query(
            'SELECT * FROM events WHERE id = ?',
            [id]
        );

        if (originalEvents.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const originalEvent = originalEvents[0];

        // Build update query dynamically based on provided fields
        const updates = [];
        const params = [];
        const changedFields = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(sanitizeInput(title));
            if (sanitizeInput(title) !== originalEvent.title) changedFields.push('title');
        }

        if (description !== undefined) {
            updates.push('description = ?');
            params.push(sanitizeInput(description));
            if (sanitizeInput(description) !== originalEvent.description) changedFields.push('description');
        }

        if (badge !== undefined) {
            const val = badge ? sanitizeInput(badge) : null;
            updates.push('badge = ?');
            params.push(val);
            if (val !== originalEvent.badge) changedFields.push('badge');
        }

        if (badge_color !== undefined) {
            updates.push('badge_color = ?');
            params.push(badge_color);
            if (badge_color !== originalEvent.badge_color) changedFields.push('badge_color');
        }

        if (image_url !== undefined) {
            updates.push('image_url = ?');
            params.push(image_url);
            if (image_url !== originalEvent.image_url) changedFields.push('image_url');
        }

        if (gradient !== undefined) {
            updates.push('gradient = ?');
            params.push(gradient);
            if (gradient !== originalEvent.gradient) changedFields.push('gradient');
        }

        if (section !== undefined && ['main', 'minecraft'].includes(section)) {
            updates.push('section = ?');
            params.push(section);
            if (section !== originalEvent.section) changedFields.push('section');
        }

        if (display_order !== undefined) {
            updates.push('display_order = ?');
            params.push(display_order);
            if (Number(display_order) !== originalEvent.display_order) changedFields.push('display_order');
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
            if ((is_active ? 1 : 0) !== originalEvent.is_active) changedFields.push('is_active');
        }

        if (req.body.start_date !== undefined) {
            updates.push('start_date = ?');
            params.push(req.body.start_date || null);
            if (req.body.start_date !== originalEvent.start_date) changedFields.push('start_date');
        }

        if (req.body.start_time !== undefined) {
            updates.push('start_time = ?');
            params.push(req.body.start_time || null);
            if (req.body.start_time !== originalEvent.start_time) changedFields.push('start_time');
        }

        if (req.body.recurrence !== undefined) {
            updates.push('recurrence = ?');
            params.push(req.body.recurrence || 'none');
            if (req.body.recurrence !== originalEvent.recurrence) changedFields.push('recurrence');
        }

        // Logic for STATUS
        // If user is NOT director/owner, any update flips status to 'pending'
        const isStaffOnly = !requireRole(user, ['director', 'owner']);

        if (isStaffOnly) {
            // Force pending if it was published/rejected
            if (originalEvent.status !== 'pending') {
                updates.push('status = ?');
                params.push('pending');
                changedFields.push('status (auto-pending)');
            }
        } else {
            // Director/Owner can manually update status if provided
            if (status !== undefined && ['pending', 'published', 'rejected'].includes(status)) {
                updates.push('status = ?');
                params.push(status);
                if (status !== originalEvent.status) changedFields.push('status');
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        params.push(id);

        // Update event
        await pool.query(
            `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

        // Only log if something actually changed compared to DB
        // But updates.length > 0 means we are executing a query. 
        // Even if we overwrite with same value, technically it's an update operation, 
        // but for audit "changedFields" is better.
        // If changedFields is empty but updates is not (e.g. overwriting same data), 
        // we might want to log it as "Updated (No changes)" or similar, or just log all updates keys?
        // User requested "detailed change". So let's use changedFields. 
        // If empty, fall back to "Updated" generic.

        await logAction(pool, user.id, 'UPDATE_EVENT', {
            id,
            title: originalEvent.title, // Use original title for identification in case title changed? Or new? 
            // Usually we want "Updated Event 'Old Name'". If name changed to 'New Name'. 
            // Let's stick to current DB state which is now updated?
            // Actually, we fetched originalEvents before update.
            // Let's use the Title from originalEvent.
            updates: changedFields.length > 0 ? changedFields : Object.keys(req.body)
        }, ip);

        // Fetch updated event (for response)
        const [updatedEvents] = await pool.query(
            'SELECT * FROM events WHERE id = ?',
            [id]
        );

        const updatedEvent = updatedEvents[0];
        const message = updatedEvent.status === 'pending'
            ? 'Cambios enviados. Serán revisados y en breves publicados.'
            : 'Evento actualizado exitosamente';

        return res.status(200).json({
            success: true,
            message,
            event: updatedEvent,
            isPending: updatedEvent.status === 'pending'
        });

    } catch (error) {
        console.error('Event update error:', error);
        return res.status(500).json({
            error: 'Error al actualizar el evento',
            details: error.message
        });
    }
}
