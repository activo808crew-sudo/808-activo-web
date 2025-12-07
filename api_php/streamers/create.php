<?php
// api_php/streamers/create.php
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

if (empty($data['channelId']) || empty($data['platform'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

try {
    // Only basic insert - skipped Twitch API verification for simplicity in V1 port
    $stmt = $pdo->prepare("INSERT INTO streamers (name, channel_id, platform, added_by) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $data['name'] ?? $data['channelId'], 
        $data['channelId'], 
        $data['platform'], 
        $user['userId']
    ]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error adding streamer']);
}
?>
