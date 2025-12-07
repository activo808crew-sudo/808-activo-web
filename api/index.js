import { join } from 'path';

export default async function handler(req, res) {
    const { url } = req;

    // Extract path relative to /api/
    const urlObj = new URL(url, `http://${req.headers.host}`);
    let pathname = urlObj.pathname; // e.g., /api/events/list

    if (pathname.startsWith('/api')) {
        pathname = pathname.substring(4); // /events/list
    }

    // Default processing to try and find the controller
    try {
        // Construct path to the controller
        // Note: In Vercel, this file is at api/index.js
        // _controllers is at api/_controllers
        // So we look for ./_controllers{pathname}.js

        // Handle root / path if needed (though usually /api/ doesn't have a root handler in this setup)
        if (pathname === '/' || pathname === '') {
            return res.status(200).json({ status: 'API Online', version: '1.0' });
        }

        const controllerPath = `./_controllers${pathname}.js`;

        // Dynamic import
        // Vercel's bundler needs to know about these files. 
        // Since they are in the same 'api' function directory, they should be included.
        const module = await import(controllerPath);

        if (module.default) {
            return await module.default(req, res);
        } else {
            return res.status(500).json({ error: 'Controller does not export default handler' });
        }

    } catch (error) {
        console.error('API Router Error:', error);

        if (error.code === 'ERR_MODULE_NOT_FOUND') {
            return res.status(404).json({ error: 'Endpoint not found', path: pathname });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
