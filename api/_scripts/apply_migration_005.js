import pool from '../_db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
    try {
        console.log('Applying migration 005: Fix status default...');

        const sql = fs.readFileSync(join(__dirname, '../migrations/005_fix_status_default.sql'), 'utf-8');

        await pool.query(sql);

        console.log('✅ Migration 005 applied successfully');
        console.log('Status column default changed to NULL');

        await pool.end();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();

