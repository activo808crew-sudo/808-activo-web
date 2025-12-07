import pool from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/004_event_status.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        // Split by semicolon to handle multiple statements if needed, though usually pool.query handles one.
        // Actually pool.query might not handle multiple statements unless configured.
        // Let's split manually.
        const statements = sql.split(';').filter(s => s.trim());

        for (const stmt of statements) {
            console.log('Executing:', stmt.substring(0, 50) + '...');
            await pool.query(stmt);
        }

        console.log('Migration 004 applied successfully');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
