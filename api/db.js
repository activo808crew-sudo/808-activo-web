import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
    host: process.env.DB_HOST || '129.213.72.114',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || '808web_user',
    password: process.env.DB_PASSWORD ?? '5q8d5PacNLrzXY9a',
    database: process.env.DB_NAME || '808web_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
