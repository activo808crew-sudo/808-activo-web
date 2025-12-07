import pool from '../api/db.js';

async function checkUsers() {
    try {
        const [users] = await pool.query('SELECT id, email, role, verified FROM staff_users ORDER BY created_at DESC');

        console.log('\n=== USUARIOS EN EL SISTEMA ===\n');
        users.forEach((u, i) => {
            console.log(`${i + 1}. Email: ${u.email}`);
            console.log(`   Rol: ${u.role}`);
            console.log(`   Verificado: ${u.verified ? 'Sí' : 'No'}`);
            console.log('');
        });

        // Check events
        const [events] = await pool.query('SELECT id, title, status, created_by FROM events ORDER BY created_at DESC LIMIT 5');
        console.log('\n=== ÚLTIMOS 5 EVENTOS ===\n');
        for (const evt of events) {
            const [creator] = await pool.query('SELECT email, role FROM staff_users WHERE id = ?', [evt.created_by]);
            console.log(`- "${evt.title}"`);
            console.log(`  Status: ${evt.status}`);
            console.log(`  Creado por: ${creator[0]?.email} (${creator[0]?.role})`);
            console.log('');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUsers();
