import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to handle API routes in development
function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle /api/streams
        if (req.url?.startsWith('/api/streams')) {
          try {
            const { default: handler } = await import('./api/streams.js');
            // Parse query string
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = Object.fromEntries(url.searchParams);

            // Create a mock request/response compatible with the handler
            const mockReq = { query, url: req.url };
            const mockRes = {
              status: (code) => {
                res.statusCode = code;
                return mockRes;
              },
              json: (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              }
            };

            await handler(mockReq, mockRes);
            return;
          } catch (error) {
            console.error('Error in /api/streams:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }

        // Handle /api/token
        if (req.url?.startsWith('/api/token')) {
          try {
            const { default: handler } = await import('./api/token.js');

            const mockReq = { query: {}, url: req.url };
            const mockRes = {
              status: (code) => {
                res.statusCode = code;
                return mockRes;
              },
              json: (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              }
            };

            await handler(mockReq, mockRes);
            return;
          } catch (error) {
            console.error('Error in /api/token:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})
