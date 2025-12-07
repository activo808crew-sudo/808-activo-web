import mysql from 'mysql2/promise';
import 'dotenv/config';

async function setupDatabase() {
    console.log("Connecting to MySQL server...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        const dbName = process.env.DB_NAME || '808web_db';
        console.log(`Creating database '${dbName}' if not exists...`);

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' is ready.`);

        await connection.end();
    } catch (error) {
        console.error("❌ Error creating database:", error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("   -> Username/Password is incorrect. Check .env file.");
        }
    }
}

setupDatabase();
