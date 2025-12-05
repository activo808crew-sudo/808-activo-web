// Servidor Node.js nativo con seguridad mejorada
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname, normalize, resolve } from 'path';
import streamsHandler from './api/streams.js';
import tokenHandler from './api/token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
};

// Rate limiting simple (prevenir spam)
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests
const RATE_WINDOW = 60000; // 1 minuto

function checkRateLimit(ip) {
    const now = Date.now();
    const record = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_WINDOW };

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_WINDOW;
    } else {
        record.count++;
    }

    requestCounts.set(ip, record);
    return record.count <= RATE_LIMIT;
}

// Limpiar rate limiting cache cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(ip);
        }
    }
}, 300000);

// Headers de seguridad
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

// Validar y sanitizar path (prevenir path traversal)
function sanitizePath(requestPath) {
    // Decodificar URL
    let decoded;
    try {
        decoded = decodeURIComponent(requestPath);
    } catch {
        return null; // URL mal formada
    }

    // Normalizar y resolver path
    const normalized = normalize(decoded).replace(/^(\.\.[\/\\])+/, '');
    const distPath = resolve(__dirname, 'dist');
    const fullPath = resolve(distPath, normalized.startsWith('/') ? normalized.substring(1) : normalized);

    // Verificar que el path esté dentro de dist/
    if (!fullPath.startsWith(distPath)) {
        return null; // Intento de path traversal
    }

    return fullPath;
}

const server = createServer(async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end('Too Many Requests');
        return;
    }

    // Security headers
    setSecurityHeaders(res);

    console.log(`${new Date().toISOString()} - ${clientIP} - ${req.method} ${req.url}`);

    try {
        // Rutas API
        if (req.url?.startsWith('/api/streams')) {
            res.setHeader('Content-Type', 'application/json');
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(url.searchParams);
            const mockReq = { query, url: req.url };
            const mockRes = {
                status: (code) => {
                    res.statusCode = code;
                    return mockRes;
                },
                json: (data) => {
                    res.end(JSON.stringify(data));
                }
            };
            await streamsHandler(mockReq, mockRes);
            return;
        }

        if (req.url?.startsWith('/api/token')) {
            res.setHeader('Content-Type', 'application/json');
            const mockReq = { query: {}, url: req.url };
            const mockRes = {
                status: (code) => {
                    res.statusCode = code;
                    return mockRes;
                },
                json: (data) => {
                    res.end(JSON.stringify(data));
                }
            };
            await tokenHandler(mockReq, mockRes);
            return;
        }

        // Servir archivos estáticos con validación de seguridad
        const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]; // Remover query params
        const filePath = sanitizePath(requestPath);

        if (!filePath) {
            // Path inválido o intento de path traversal
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        // Verificar que el archivo existe y no es un directorio
        let stats;
        try {
            stats = await stat(filePath);
            if (stats.isDirectory()) {
                // Si es directorio, intentar servir index.html
                const indexPath = join(filePath, 'index.html');
                stats = await stat(indexPath);
                const content = await readFile(indexPath);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
                return;
            }
        } catch {
            // Archivo no encontrado, servir index.html para SPA routing
            const indexPath = resolve(__dirname, 'dist', 'index.html');
            try {
                const indexContent = await readFile(indexPath);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(indexContent);
            } catch {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
            return;
        }

        // Leer y servir el archivo
        const content = await readFile(filePath);
        const ext = extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Cache headers para assets estáticos
        if (['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 año
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);

    } catch (err) {
        console.error('Server error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo archivos desde: ${join(__dirname, 'dist')}`);
    console.log(`🔗 Endpoints API: /api/streams, /api/token`);
    console.log(`🔒 Seguridad activada: Headers, Rate Limiting, Path Validation`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
