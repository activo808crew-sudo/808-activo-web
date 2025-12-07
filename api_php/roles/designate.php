<?php
// api_php/roles/designate.php
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

if (!$user || !in_array($user['role'], ['admin', 'owner', 'director'])) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['userId'] ?? null;
$newRole = $data['role'] ?? null;

if (!$userId || !$newRole) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

// Basic validation of roles
$validRoles = ['user', 'streamer', 'staff', 'admin', 'owner', 'director', 'creative', 'developer'];
if (!in_array($newRole, $validRoles)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid role']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->execute([$newRole, $userId]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
