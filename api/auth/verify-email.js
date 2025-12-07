import pool from '../db.js';
import { verifyVerificationToken } from '../utils/auth.js';
import { sendWelcomeEmail } from '../utils/email.js';

export default async function handler(req, res) {
    // Allow both GET and POST for flexibility
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get token from query params or body
        const token = req.query.token || req.body?.token;

        if (!token) {
            return res.status(400).json({ error: 'Token de verificación requerido' });
        }

        // Verify token format and expiration
        if (!verifyVerificationToken(token)) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        // Find user with this token
        const [users] = await pool.query(
            `SELECT id, email, verified, verification_token_expires 
       FROM staff_users 
       WHERE verification_token = ? AND verified = FALSE`,
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({
                error: 'Token inválido o cuenta ya verificada'
            });
        }

        const user = users[0];

        // Check if token is expired (double check beyond JWT expiration)
        if (new Date(user.verification_token_expires) < new Date()) {
            return res.status(400).json({ error: 'El token ha expirado' });
        }

        // Update user as verified
        await pool.query(
            `UPDATE staff_users 
       SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
       WHERE id = ?`,
            [user.id]
        );

        // Send welcome email
        await sendWelcomeEmail(user.email, null);

        // Return success - frontend can redirect to login
        return res.status(200).json({
            success: true,
            message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
            redirectTo: '/staff'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({ error: 'Error al verificar el email' });
    }
}
