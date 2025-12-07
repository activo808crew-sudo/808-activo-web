import pool from '../api/db.js';

async function verify() {
    try {
        // Check column definition
        console.log('\n=== VERIFICAR COLUMNA STATUS ===');
        const [columns] = await pool.query("SHOW COLUMNS FROM events LIKE 'status'");
        console.log('Column definition:', JSON.stringify(columns[0], null, 2));

        // Check latest events
        console.log('\n=== ÚLTIMOS 3 EVENTOS ===');
        const [events] = await pool.query(`
            SELECT e.id, e.title, e.status, e.created_at, u.email, u.role 
            FROM events e 
            LEFT JOIN staff_users u ON e.created_by = u.id 
            ORDER BY e.created_at DESC 
            LIMIT 3
        `);

        events.forEach((evt, i) => {
            console.log(`\n${i + 1}. "${evt.title}"`);
            console.log(`   Status: ${evt.status}`);
            console.log(`   Creado por: ${evt.email} (${evt.role})`);
            console.log(`   Fecha: ${evt.created_at}`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verify();
