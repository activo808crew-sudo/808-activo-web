import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {object} user - User object with id, email, role
 * @returns {string} JWT token
 */
export function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Extract and verify JWT token from request headers
 * @param {object} req - Request object
 * @returns {object|null} Decoded user payload or null
 */
export function requireAuth(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    return verifyToken(token);
}

/**
 * Check if user has required role
 * @param {object} user - User object with role property
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean} True if user has required role
 */
export function requireRole(user, allowedRoles) {
    if (!user || !user.role) {
        return false;
    }

    return allowedRoles.includes(user.role);
}

/**
 * Generate a random verification token
 * @returns {string} Random token
 */
export function generateVerificationToken() {
    return jwt.sign(
        { type: 'email-verification', timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

/**
 * Verify an email verification token
 * @param {string} token - Verification token
 * @returns {boolean} True if valid
 */
export function verifyVerificationToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.type === 'email-verification';
    } catch (error) {
        return false;
    }
}
