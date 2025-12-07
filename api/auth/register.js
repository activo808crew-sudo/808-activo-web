import pool from '../db.js';
import { hashPassword, generateVerificationToken } from '../utils/auth.js';
import { validateEmail, validatePassword, validateStaffKey, validateUsername, sanitizeInput } from '../utils/validation.js';
import { sendVerificationEmail } from '../utils/email.js';
import { logAction } from '../utils/audit.js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, username, password, staffKey } = req.body;

        // Validate input
        if (!email || !username || !password || !staffKey) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        // Validate username format
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Usuario inválido. Usa letras, números o guiones bajos (3-20 caracteres).' });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Validate staff key format
        if (!validateStaffKey(staffKey)) {
            return res.status(400).json({ error: 'Clave de staff inválida' });
        }

        // Sanitize inputs
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedUsername = sanitizeInput(username);

        // Check if email or username already exists
        const [existingUsers] = await pool.query(
            'SELECT id, email, username FROM staff_users WHERE email = ? OR username = ?',
            [sanitizedEmail, sanitizedUsername]
        );

        if (existingUsers.length > 0) {
            const match = existingUsers[0];
            if (match.email === sanitizedEmail) {
                return res.status(400).json({ error: 'Este email ya está registrado' });
            }
            if (match.username === sanitizedUsername) {
                return res.status(400).json({ error: 'Este nombre de usuario ya está ocupado' });
            }
        }

        // Verify staff key is valid, not used, and not expired
        const [staffKeys] = await pool.query(
            'SELECT id, created_by, is_used, expires_at FROM staff_keys WHERE key_value = ?',
            [staffKey]
        );

        if (staffKeys.length === 0) {
            return res.status(400).json({ error: 'Clave de staff inválida' });
        }

        const key = staffKeys[0];

        if (key.is_used) {
            return res.status(400).json({ error: 'Esta clave ya ha sido utilizada' });
        }

        if (new Date(key.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Esta clave ha expirado' });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const [result] = await pool.query(
            `INSERT INTO staff_users (email, username, password_hash, role, verified, verification_token, verification_token_expires) 
       VALUES (?, ?, ?, 'staff', FALSE, ?, ?)`,
            [sanitizedEmail, sanitizedUsername, passwordHash, verificationToken, verificationExpires]
        );

        const userId = result.insertId;

        // Mark staff key as used
        await pool.query(
            'UPDATE staff_keys SET is_used = TRUE, used_by = ?, used_at = NOW() WHERE id = ?',
            [userId, key.id]
        );

        // Send verification email
        const emailResult = await sendVerificationEmail(sanitizedEmail, verificationToken);

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't fail registration if email fails, user can request new verification email
        }

        // Audit Log: Registration
        // We use userId as 'user_id' because they are the one being created (self-action effectively)
        // Or we could use 'system' if preferred, but attributing to the new user ID is better for traceability.
        // IP address logic:
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Dynamic import to avoid circular dep issues if any, or standard import. Standard is fine.
        // But need to import logAction at top.
        await logAction(pool, userId, 'REGISTER_USER', {
            email: sanitizedEmail,
            username: sanitizedUsername,
            role: 'staff',
            key_used: key.key_value
        }, ip);

        return res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente. Por favor, verifica tu email.',
            email: sanitizedEmail
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Error al crear la cuenta' });
    }
}
