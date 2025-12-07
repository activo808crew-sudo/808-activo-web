
import pool from '../api/db.js';
import 'dotenv/config';

async function checkStreamers() {
    try {
        console.log('Checking connection to:', process.env.DB_HOST);
        const [rows] = await pool.query('SELECT * FROM streamers ORDER BY is_live DESC, created_at ASC');
        console.log(`Found ${rows.length} streamers in DB (Ordered):`);
        rows.forEach(r => console.log(`- ${r.channel_id} (ID: ${r.id})`));
        process.exit(0);
    } catch (err) {
        console.error('DB Check Failed:', err);
        process.exit(1);
    }
}

checkStreamers();
