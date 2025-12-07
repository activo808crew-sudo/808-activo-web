import pool from '../db.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { sendStaffKeyEmail } from '../utils/email.js';

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

        // Check if user has required role (director or owner)
        if (!requireRole(user, ['director', 'owner'])) {
            return res.status(403).json({
                error: 'No tienes permisos para generar claves de staff'
            });
        }

        // Generate unique staff key
        const staffKey = uuidv4();

        // Set expiration date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Insert staff key into database
        await pool.query(
            `INSERT INTO staff_keys (key_value, created_by, expires_at) 
       VALUES (?, ?, ?)`,
            [staffKey, user.id, expiresAt]
        );

        // Optionally send email to the director/owner with the key
        await sendStaffKeyEmail(user.email, staffKey);

        return res.status(201).json({
            success: true,
            staffKey,
            expiresAt,
            message: 'Clave de staff generada exitosamente'
        });

    } catch (error) {
        console.error('Staff key generation error:', error);
        return res.status(500).json({ error: 'Error al generar la clave' });
    }
}
