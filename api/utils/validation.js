/**
 * Validation utilities for user input
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} {valid: boolean, message: string}
 */
export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'La contraseña es requerida' };
    }

    if (password.length < 8) {
        return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (password.length > 128) {
        return { valid: false, message: 'La contraseña es demasiado larga' };
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
        return { valid: false, message: 'La contraseña debe contener letras y números' };
    }

    return { valid: true, message: 'Contraseña válida' };
}

/**
 * Validate staff key format
 * @param {string} key - Staff key to validate
 * @returns {boolean} True if valid format
 */
export function validateStaffKey(key) {
    if (!key || typeof key !== 'string') {
        return false;
    }

    // UUID v4 format or alphanumeric 32+ chars
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const alphanumericRegex = /^[a-zA-Z0-9]{32,}$/;

    return uuidRegex.test(key) || alphanumericRegex.test(key);
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .substring(0, 1000); // Limit length
}

/**
 * Validate event data
 * @param {object} event - Event object to validate
 * @returns {object} {valid: boolean, errors: string[]}
 */
export function validateEventData(event) {
    const errors = [];

    if (!event.title || event.title.trim().length === 0) {
        errors.push('El título es requerido');
    } else if (event.title.length > 255) {
        errors.push('El título es demasiado largo (máximo 255 caracteres)');
    }

    if (!event.description || event.description.trim().length === 0) {
        errors.push('La descripción es requerida');
    } else if (event.description.length > 1000) {
        errors.push('La descripción es demasiado larga (máximo 1000 caracteres)');
    }

    if (!event.image_url || event.image_url.trim().length === 0) {
        errors.push('La URL de la imagen es requerida');
    } else if (!isValidUrl(event.image_url)) {
        errors.push('La URL de la imagen no es válida');
    }

    if (event.section && !['main', 'minecraft'].includes(event.section)) {
        errors.push('Sección inválida (debe ser "main" o "minecraft")');
    }

    if (event.badge && event.badge.length > 50) {
        errors.push('El texto del badge es demasiado largo (máximo 50 caracteres)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Check if string is valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

/**
 * Validate role
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
export function validateRole(role) {
    return ['owner', 'director', 'staff'].includes(role);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid username
 */
export function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return false;
    }

    // Alphanumeric, underscores, 3-20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}
