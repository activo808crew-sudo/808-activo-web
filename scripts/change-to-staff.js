import pool from '../api/db.js';

async function changeRole() {
    try {
        const email = 'xenonarenaps3@gmail.com';

        await pool.query(
            'UPDATE staff_users SET role = ? WHERE email = ?',
            ['staff', email]
        );

        console.log(`✅ Rol cambiado: ${email} ahora es 'staff'`);

        const [user] = await pool.query('SELECT email, role FROM staff_users WHERE email = ?', [email]);
        console.log('Verificación:', user[0]);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

changeRole();
