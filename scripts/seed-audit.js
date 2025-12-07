
import pool from '../api/db.js';
import 'dotenv/config';

async function seedAudit() {
    try {
        console.log('Seeding initial audit log...');
        // User ID 1 is usually owner if seeded by init-owner
        // Or we can use NULL for system? Schema allowed NULL?
        // Let's use user_id 1 (Owner) assuming it exists.
        const [users] = await pool.query('SELECT id FROM staff_users LIMIT 1');
        const userId = users.length > 0 ? users[0].id : null;

        if (!userId) {
            console.log('No users found to attach log to.');
            process.exit(0);
        }

        await pool.query(`
        INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
        VALUES (?, 'SYSTEM_INIT', '{"message": "System audit log initialized"}', '127.0.0.1', NOW())
    `, [userId]);

        console.log('Seeded 1 audit log.');
        process.exit(0);
    } catch (err) {
        console.error('Seed Failed:', err);
        process.exit(1);
    }
}

seedAudit();
