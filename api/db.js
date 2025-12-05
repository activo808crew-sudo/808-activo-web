import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: '808web_user',
    password: '5q8d5PacNLrzXY9a',
    database: '808web_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
