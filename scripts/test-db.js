import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
    console.log("--- Database Connection Test ---");
    console.log("Environment Variables Loaded:");
    console.log(`DB_HOST: ${process.env.DB_HOST || '(using default)'}`);
    console.log(`DB_USER: ${process.env.DB_USER || '(using default)'}`);
    console.log(`DB_PORT: ${process.env.DB_PORT || '(using default)'}`);

    const configs = [
        { host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || '808web_user', password: process.env.DB_PASSWORD || '5q8d5PacNLrzXY9a', database: process.env.DB_NAME || '808web_db' },
        { host: '129.213.72.114', user: process.env.DB_USER || '808web_user', password: process.env.DB_PASSWORD || '5q8d5PacNLrzXY9a', database: process.env.DB_NAME || '808web_db' }
    ];

    for (const config of configs) {
        console.log(`\nTesting connection to ${config.host}:${process.env.DB_PORT || 3306}...`);
        try {
            const connection = await mysql.createConnection(config);
            console.log("✅ SUCCESS! Connected successfully.");
            await connection.end();
            return;
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}`);
        }
    }

    console.log("\n--- Troubleshooting ---");
    console.log("1. Open XAMPP/WAMP Control Panel.");
    console.log("2. Verify MySQL module is GREEN (Running).");
    console.log("3. Verify the Port is 3306. If different, update .env file.");
}

testConnection();
