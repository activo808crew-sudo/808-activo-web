import pool from './db.js';

// Initialize tables
async function initDB() {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
      CREATE TABLE IF NOT EXISTS shop_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS shop_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        event_type VARCHAR(50) NOT NULL, -- 'view', 'add_to_cart', 'purchase'
        item_id VARCHAR(255),
        item_name VARCHAR(255),
        item_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        connection.release();
        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing DB:', err);
    }
}

// Run init once
initDB();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'POST') {
            const { type, data } = req.body;

            if (type === 'login') {
                // Track user login
                const { username } = data;
                await pool.query(
                    'INSERT INTO shop_users (username) VALUES (?) ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP',
                    [username]
                );
                return res.status(200).json({ success: true });
            }

            if (type === 'event') {
                // Track event (view, cart, purchase)
                const { username, event_type, item_id, item_name, item_price } = data;
                await pool.query(
                    'INSERT INTO shop_events (username, event_type, item_id, item_name, item_price) VALUES (?, ?, ?, ?, ?)',
                    [username || 'anonymous', event_type, item_id, item_name, item_price || 0]
                );
                return res.status(200).json({ success: true });
            }
        }

        if (req.method === 'GET') {
            // Get featured items based on popularity (add_to_cart weighted higher than view)
            // We'll look at the last 30 days
            const [rows] = await pool.query(`
        SELECT 
          item_id, 
          item_name, 
          COUNT(*) as popularity_score 
        FROM shop_events 
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND event_type IN ('add_to_cart', 'purchase')
        GROUP BY item_id, item_name 
        ORDER BY popularity_score DESC 
        LIMIT 6
      `);

            return res.status(200).json({ featured: rows });
        }

        res.status(404).json({ error: 'Not found' });

    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: err.message });
    }
}
