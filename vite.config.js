import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'

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
        console.error("JSON parse error", e);
        resolve({});
      }
    });
  });
};

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          // Parse URL and Query
          const urlObj = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(urlObj.searchParams);
          const pathname = urlObj.pathname; // e.g. /api/auth/login

          // Construct file path: ./api/auth/login.js
          // Remove leading / and append .js if not present (though our convention is explicit)
          // Actually, mapped path is relative to root.
          const relativePath = '.' + pathname + '.js';
          const absolutePath = path.resolve(process.cwd(), relativePath);

          if (!fs.existsSync(absolutePath)) {
            // Fallback for files that might already have extension, or index?
            // For now assume identical mapping as per vercel.json rewrites
            console.warn(`API route not found: ${absolutePath}`);
            return next();
          }

          // Parse Body
          const body = await parseBody(req);

          // Import Handler using absolute file URL (critical for Windows/Vite)
          // Use timestamp to invalidate cache in dev if needed, or rely on Vite's handling (dynamic import might be cached by Node)
          // In simple dev server, dynamic import is okay.
          const fileUrl = pathToFileURL(absolutePath).href;
          const { default: handler } = await import(fileUrl + `?t=${Date.now()}`);

          // Mock Vercel Request/Response
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

        } catch (error) {
          console.error(`Error in API route ${req.url}:`, error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 5173
  }
})
