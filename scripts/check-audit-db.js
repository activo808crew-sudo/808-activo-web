
import pool from '../api/db.js';
import 'dotenv/config';

async function checkAudit() {
    try {
        console.log('Checking connection to:', process.env.DB_HOST);
        const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5');
        console.log(`Found ${rows.length} recent audit logs:`);
        rows.forEach(r => console.log(`- [${r.created_at}] Action: ${r.action} (User: ${r.user_id})`));
        process.exit(0);
    } catch (err) {
        console.error('Audit Check Failed:', err);
        process.exit(1);
    }
}

checkAudit();
