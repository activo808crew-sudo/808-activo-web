<?php
// db.php - Database Connection

$host = 'localhost'; // On nysr.host, localhost is correct
$db   = '808web_db';
$user = '808web_user';
$pass = '5q8d5PacNLrzXY9a';
$charset = 'utf8mb4';

// Try to get from ENV if available (for Docker/local emulation)
if (getenv('DB_HOST')) $host = getenv('DB_HOST');
if (getenv('DB_NAME')) $db = getenv('DB_NAME');
if (getenv('DB_USER')) $user = getenv('DB_USER');
if (getenv('DB_PASSWORD')) $pass = getenv('DB_PASSWORD');

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // In production, don't show specific error details for security
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
