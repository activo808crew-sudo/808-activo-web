<?php
// api_php/staff-keys/generate.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = null;
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) $token = $matches[1];
$user = JWT::decode($token);

if (!$user || !in_array($user['role'], ['owner', 'director'])) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

try {
    // Generate a random key
    $key = bin2hex(random_bytes(16)); // 32 chars
    $expires = date('Y-m-d H:i:s', strtotime('+7 days'));

    $stmt = $pdo->prepare("INSERT INTO staff_keys (key_value, created_by, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$key, $user['userId'], $expires]);

    echo json_encode(['success' => true, 'key' => $key]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error generating key']);
}
?>
