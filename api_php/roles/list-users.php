<?php
// api_php/roles/list-users.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = null;
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) $token = $matches[1];
$user = JWT::decode($token);

if (!$user || !in_array($user['role'], ['admin', 'owner', 'director'])) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT id, username, email, role, created_at, is_verified FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();

    echo json_encode(['success' => true, 'users' => $users]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
