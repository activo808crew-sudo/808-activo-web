import mysql from 'mysql2/promise';
import 'dotenv/config';

const streamers = ['MissiFussa', 'Yaqz29', 'parzival016', 'valesuki___', 'ladycherryblack'];

async function seedStreamers() {
    console.log("Seeding streamers...");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME || '808web_db'
    });

    try {
        // 1. Get Owner ID
        const [users] = await connection.query('SELECT id FROM staff_users WHERE email = ?', ['activo808crew@gmail.com']);

        if (users.length === 0) {
            console.error("❌ Owner user not found! Please run 'node scripts/init-owner.js' first.");
            process.exit(1);
        }

        const ownerId = users[0].id;

        // 2. Insert Streamers if not exist
        for (const login of streamers) {
            // Check if exists
            const [existing] = await connection.query('SELECT id FROM streamers WHERE channel_id = ?', [login]);

            if (existing.length === 0) {
                console.log(`Adding streamer: ${login}`);
                await connection.query(
                    `INSERT INTO streamers (name, platform, channel_id, created_by) 
                     VALUES (?, 'twitch', ?, ?)`,
                    [login, login, ownerId]
                );
            } else {
                console.log(`Streamer ${login} already exists. Skipping.`);
            }
        }

        console.log("✅ Streamers seeding completed.");

    } catch (error) {
        console.error("❌ Error seeding streamers:", error);
    } finally {
        await connection.end();
    }
}

seedStreamers();
