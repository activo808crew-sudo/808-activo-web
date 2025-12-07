import mysql from 'mysql2/promise';
import 'dotenv/config';

const events = [
    {
        title: "Torneo PvP",
        description: "Compite y gana premios exclusivos en nuestro torneo mensual.",
        badge: "PRÓXIMAMENTE",
        badge_color: "bg-purple-600",
        image_url: "https://images.wallpapersden.com/image/download/heist-fortnite_bGdoZWWUmZqaraWkpJRobWllrWdma2U.jpg",
        gradient: "from-purple-900/50 to-blue-900/50",
        section: "main",
        display_order: 1
    },
    {
        title: "Cine en Discord",
        description: "Noches de películas y series con la comunidad cada viernes.",
        badge: "VIERNES",
        badge_color: "bg-blue-600",
        image_url: "https://preview.redd.it/81g4h40e2c471.jpg?width=640&crop=smart&auto=webp&s=e3af4e909fc4a309bbcf8fde58dfac3612ac5051",
        gradient: "from-blue-900/50 to-purple-900/50",
        section: "main",
        display_order: 2
    },
    {
        title: "Giveaways",
        description: "Sorteos de Nitro, juegos y hardware para miembros activos.",
        badge: "MENSUAL",
        badge_color: "bg-pink-600",
        image_url: "https://cdn.shopify.com/s/files/1/0327/9585/2937/files/Discord---Nitro-Monthly-_INT.jpg?w=400&h=500&fit=crop",
        gradient: "from-pink-900/50 to-purple-900/50",
        section: "main",
        display_order: 3
    },
    {
        title: "LAN Party",
        description: "Conectate a conocer gente nueva y divertirte con amigos.",
        badge: "SÁBADO",
        badge_color: "bg-yellow-600",
        image_url: "https://i.imgur.com/YLu2y8G.png",
        gradient: "from-yellow-900/50 to-orange-900/50",
        section: "main",
        display_order: 4
    },
    {
        title: "WELCOME TO THE NETHER",
        description: "Únete para explorar el Nether con todos nosotros.",
        badge: "EVENTO",
        badge_color: "bg-green-600",
        image_url: "https://i.imgur.com/syIFmsS.png",
        gradient: "from-blue-900/40 to-purple-900/40",
        section: "minecraft",
        display_order: 1
    }
];

async function seedEvents() {
    console.log("Seeding events...");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root', // Explicitly fallback to root if setup used it
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
        console.log(`Using Owner ID: ${ownerId}`);

        // 2. Clear existing? Maybe optionally.
        // Let's assume we want to restore ONLY if empty, or just append?
        // User said "no estan los eventos", implying empty.
        // We'll insert with INSERT IGNORE or just insert.
        // But table structure doesn't have unique constraint on title.
        // We might duplicate if run multiple times.
        // I'll delete all events first to be clean to "restore".
        await connection.query('DELETE FROM events');
        console.log("Cleared existing events.");

        // 3. Insert Events
        for (const event of events) {
            await connection.query(
                `INSERT INTO events (title, description, badge, badge_color, image_url, gradient, section, display_order, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    event.title,
                    event.description,
                    event.badge,
                    event.badge_color,
                    event.image_url,
                    event.gradient,
                    event.section,
                    event.display_order,
                    ownerId
                ]
            );
        }

        console.log(`✅ Successfully seeded ${events.length} events assigned to activo808crew@gmail.com.`);

    } catch (error) {
        console.error("❌ Error seeding events:", error);
    } finally {
        await connection.end();
    }
}

seedEvents();
