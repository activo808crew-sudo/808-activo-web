import pool from '../../_db.js';
import { verifyPassword, generateToken } from '../../_utils/auth.js';
import { validateEmail, sanitizeInput } from '../../_utils/validation.js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Accept 'email' field as generic identifier (email or username)
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Usuario/Email y contraseña son requeridos' });
        }

        // Sanitize identifier
        const identifier = sanitizeInput(email);

        // Find user by email OR username
        // Note: Emails are stored lowercase, usernames are case preserving but usually unique CI
        // For safety, we search both. 
        const [users] = await pool.query(
            'SELECT id, email, username, password_hash, role, verified FROM staff_users WHERE email = ? OR username = ?',
            [identifier.toLowerCase(), identifier]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Check if email is verified
        if (!user.verified) {
            return res.status(403).json({
                error: 'Por favor, verifica tu email antes de iniciar sesión',
                needsVerification: true
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username
        });

        // Return user profile and token
        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Error al iniciar sesión' });
    }
}

