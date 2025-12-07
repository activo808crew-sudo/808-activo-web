import pool from '../api/db.js';
import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve('api', 'migrations', '008_event_dates.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
    try {
        console.log('Applying 008 migration...');
        const queries = sql.split(';').filter(q => q.trim());
        for (const query of queries) {
            await pool.query(query);
        }
        console.log('✅ Applied 008_event_dates.sql');
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e.message);
        process.exit(1);
    }
}
run();
