import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import pool from '../api/db.js';
import { hashPassword } from '../api/utils/auth.js';

async function initOwner() {
    console.log("--- Configuration ---");
    console.log(`DB_HOST: ${process.env.DB_HOST || '127.0.0.1 (default)'}`);
    console.log(`DB_USER: ${process.env.DB_USER || '808web_user (default) - IF THIS IS WRONG, CHECK .ENV'}`);
    console.log("---------------------");

    const email = 'activo808crew@gmail.com';
    const password = 'DE808crew';

    console.log(`Initializing owner account for ${email}...`);

    try {
        // Check if owner already exists
        const [existing] = await pool.query('SELECT id FROM staff_users WHERE email = ?', [email]);

        if (existing.length > 0) {
            console.log('Owner account already exists.');
            process.exit(0);
        }

        const passwordHash = await hashPassword(password);

        // Create owner account with verified=true
        await pool.query(
            `INSERT INTO staff_users (email, password_hash, role, verified) 
       VALUES (?, ?, 'owner', TRUE)`,
            [email, passwordHash]
        );

        console.log('Owner account created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating owner account:', error);
        process.exit(1);
    }
}

initOwner();
