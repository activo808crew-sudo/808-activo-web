// Servidor Node.js nativo con seguridad mejorada y soporte API dinámico
import 'dotenv/config';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname, normalize, resolve } from 'path';

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
const RATE_LIMIT = 300; // Increased for API usage
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
    // Allow CORS because frontend might be on different port in dev, or same origin in prod
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Helper to parse body
const parseBody = async (req) => {
    return new Promise((resolve) => {
        if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
            return resolve({});
        }

        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve({});
            }
        });
    });
};

const server = createServer(async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Handle OPTIONS for CORS
    if (req.method === 'OPTIONS') {
        setSecurityHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

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
        // Dynamic API Handling
        if (req.url?.startsWith('/api/')) {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(urlObj.searchParams);
            const pathname = urlObj.pathname;

            // Map to file: ./api/auth/login -> ./api/auth/login.js
            const relativePath = '.' + pathname + '.js';
            const absolutePath = resolve(__dirname, relativePath);

            if (existsSync(absolutePath)) {
                try {
                    const body = await parseBody(req);
                    const { default: handler } = await import(relativePath);

                    const mockReq = {
                        url: req.url,
                        method: req.method,
                        query,
                        body,
                        headers: req.headers
                    };

                    const mockRes = {
                        status: (code) => {
                            res.statusCode = code;
                            return mockRes;
                        },
                        json: (data) => {
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(data));
                            return mockRes;
                        },
                        setHeader: (key, val) => {
                            res.setHeader(key, val);
                            return mockRes;
                        },
                        end: (val) => {
                            res.end(val);
                            return mockRes;
                        }
                    };

                    await handler(mockReq, mockRes);
                    return;

                } catch (e) {
                    console.error(`API Error ${pathname}:`, e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal API Error' }));
                    return;
                }
            }
            // If not found, fall through to static file serving logic which will return 404 or index.html
            // But for /api/ we should probably return 404 JSON to be clear
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API Endpoint not found' }));
            return;
        }

        // Static Files Serving
        // Validar y sanitizar path (prevenir path traversal)
        let requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];

        // Normalize path
        const safeSuffix = normalize(requestPath).replace(/^(\.\.[\/\\])+/, '');
        const distPath = resolve(__dirname, 'dist');
        const filePath = resolve(distPath, safeSuffix.startsWith('/') ? safeSuffix.substring(1) : safeSuffix);

        // Security check
        if (!filePath.startsWith(distPath)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }

        // Check if file exists
        let stats;
        try {
            stats = await stat(filePath);
            if (stats.isDirectory()) {
                throw new Error("Is dir");
            }
        } catch {
            // Fallback to index.html for SPA
            const indexPath = resolve(distPath, 'index.html');
            try {
                const indexContent = await readFile(indexPath);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(indexContent);
            } catch {
                res.writeHead(404);
                res.end('Not Found');
            }
            return;
        }

        // Serve file
        const content = await readFile(filePath);
        const ext = extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Cache headers
        if (['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'].includes(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
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
    console.log(`🔗 API Dinámica Habilitada en /api/*`);
});
