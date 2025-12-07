import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import pool from '../api/db.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log("Starting database migration (002 - Streamers & Audit)...");

    // Explicitly targeting 003 for this update
    const migrationFile = path.join(__dirname, '../api/migrations/003_add_username.sql');
    console.log(`Reading migration file: ${migrationFile}`);

    if (!fs.existsSync(migrationFile)) {
        console.error("Migration file not found!");
        process.exit(1);
    }

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');

        // Split queries by semicolon, filter empty
        const queries = sql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Found ${queries.length} queries to execute.`);

        // Get a dedicated connection for transaction
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const query of queries) {
                console.log(`Executing: ${query.substring(0, 50).replace(/\n/g, ' ')}...`);
                // Use try/catch for individual queries if needed, but for Schema creation we want to stop on error usually.
                // IF NOT EXISTS logic in SQL handles duplicates.
                await connection.query(query);
            }

            await connection.commit();
            console.log("✅ Migration (002) completed successfully.");
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

migrate();
