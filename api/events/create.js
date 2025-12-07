import pool from '../db.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { validateEventData, sanitizeInput } from '../utils/validation.js';
import { logAction } from '../utils/audit.js';
import { sendDiscordWebhook, createEventEmbed } from '../utils/discord.js';
import { generateAnnouncementText } from '../utils/ai.js';

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

        const {
            title,
            description,
            badge,
            badge_color,
            image_url,
            gradient,
            section,
            display_order,
            start_date,
            start_time,
            recurrence
        } = req.body;

        // Validate event data
        const validation = validateEventData({
            title,
            description,
            badge,
            image_url,
            section
        });

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validation.errors
            });
        }

        // Sanitize inputs
        const sanitizedTitle = sanitizeInput(title);
        const sanitizedDescription = sanitizeInput(description);
        const sanitizedBadge = badge ? sanitizeInput(badge) : null;
        const sanitizedBadgeColor = badge_color || 'bg-purple-600';
        const sanitizedGradient = gradient || 'from-purple-900/50 to-blue-900/50';
        const sanitizedSection = section || 'main';
        const sanitizedDisplayOrder = display_order || 0;

        // New fields (nullable)
        const sanitizedStartDate = start_date || null;
        const sanitizedStartTime = start_time || null;
        const sanitizedRecurrence = recurrence || 'none';

        // Determine status based on user role
        const status = requireRole(user, ['director', 'owner']) ? 'published' : 'pending';

        // Insert event into database
        const [result] = await pool.query(
            `INSERT INTO events 
            (title, description, badge, badge_color, image_url, gradient, section, display_order, created_by, status, start_date, start_time, recurrence) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sanitizedTitle,
                sanitizedDescription,
                sanitizedBadge,
                sanitizedBadgeColor,
                image_url, // Already validated as URL
                sanitizedGradient,
                sanitizedSection,
                sanitizedDisplayOrder,
                user.id,
                status,
                sanitizedStartDate,
                sanitizedStartTime,
                sanitizedRecurrence
            ]
        );

        // Fetch the created event
        const [events] = await pool.query(
            'SELECT * FROM events WHERE id = ?',
            [result.insertId]
        );
        const newEvent = events[0];

        // Audit Log
        const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
        await logAction(pool, user.id, 'CREATE_EVENT', { id: result.insertId, title: sanitizedTitle, status }, ip);

        // --- DISCORD ANNOUNCEMENT ---
        if (status === 'published') {
            // Run asynchronously to not block response (in Vercel Edge/Serverless this might be cut off, 
            // but usually valid for short tasks. Ideally use a queue, but simple await is fine for now).
            // We use Promise.allSettled to not fail the request if Discord fails.
            (async () => {
                try {
                    console.log('[Discord] Generating announcement...');
                    const aiText = await generateAnnouncementText(newEvent);
                    const embed = createEventEmbed({
                        title: newEvent.title,
                        description: newEvent.description,
                        image_url: newEvent.image_url,
                        color: newEvent.section === 'minecraft' ? 0x22c55e : 0x9333ea,
                        start_date: newEvent.start_date,
                        start_time: newEvent.start_time
                    });

                    await sendDiscordWebhook(process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS, {
                        content: aiText + ' @everyone',
                        embeds: [embed]
                    });
                    console.log('[Discord] Announcement sent.');
                } catch (err) {
                    console.error('[Discord] Failed to announce:', err);
                }
            })();
        }

        // Different message based on status
        const message = status === 'pending'
            ? 'Solicitud enviada. Será revisada y en breves publicada.'
            : 'Evento creado exitosamente';

        return res.status(201).json({
            success: true,
            message,
            event: newEvent,
            isPending: status === 'pending'
        });

    } catch (error) {
        console.error('Event creation error:', error);
        return res.status(500).json({
            error: 'Error al crear el evento',
            details: error.message
        });
    }
}
