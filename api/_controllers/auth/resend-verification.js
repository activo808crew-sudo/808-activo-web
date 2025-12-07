import pool from '../../_db.js';
import { generateVerificationToken } from '../../_utils/auth.js';
import { validateEmail, sanitizeInput } from '../../_utils/validation.js';
import { sendVerificationEmail } from '../../_utils/email.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        const sanitizedEmail = sanitizeInput(email).toLowerCase();

        // Check if user exists and is NOT verified
        const [users] = await pool.query(
            'SELECT id, email, verified FROM staff_users WHERE email = ?',
            [sanitizedEmail]
        );

        if (users.length === 0) {
            // Avoid leaking user existence, but for unverified re-send it's tricky. 
            // Standard practice: "If the email is valid and unverified, we sent a link."
            return res.status(200).json({ message: 'Si el correo existe y no está verificado, se ha enviado un nuevo enlace.' });
        }

        const user = users[0];

        if (user.verified) {
            return res.status(400).json({ error: 'Este usuario ya está verificado.' });
        }

        // Generate new token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update DB
        await pool.query(
            'UPDATE staff_users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
            [verificationToken, verificationExpires, user.id]
        );

        // Send Email
        await sendVerificationEmail(sanitizedEmail, verificationToken);

        return res.status(200).json({
            success: true,
            message: 'Nuevo enlace de verificación enviado. Revisa tu correo (y spam).'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({ error: 'Error al reenviar verificación' });
    }
}

