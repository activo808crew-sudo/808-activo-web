import pool from '../db.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
    try {
        console.log('Applying migration 006: Add pending_deletion status...');

        const sql = fs.readFileSync(join(__dirname, '../migrations/006_event_deletion_state.sql'), 'utf-8');

        await pool.query(sql);

        console.log('✅ Migration 006 applied successfully');
        console.log('Status ENUM now includes: pending, published, rejected, pending_deletion');

        await pool.end();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
