<?php
// api_php/events/delete.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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

// Get ID from query string (GET param style for DELETE often used) or body?
// Frontend: `/api/events/delete?id=${id}`
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al eliminar evento']);
}
?>
