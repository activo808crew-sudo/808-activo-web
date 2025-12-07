<?php
// api_php/events/create.php
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

if (!$user || !in_array($user['role'], ['admin', 'owner', 'director', 'creative', 'developer'])) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

try {
    // Basic validation
    if (empty($data['title']) || empty($data['start_date']) || empty($data['section'])) {
         http_response_code(400);
         echo json_encode(['error' => 'Faltan campos requeridos']);
         exit;
    }

    $sql = "INSERT INTO events (
        title, description, start_date, start_time, 
        image_url, badge, badge_color, 
        gradient, section, recurrence, 
        display_order, status, created_by
    ) VALUES (
        ?, ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, ?
    )";

    $status = 'published'; // Default or from input
    // Node logic had AI generation here. Skipping for PHP V1.

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['title'],
        $data['description'] ?? '',
        $data['start_date'],
        $data['start_time'] ?? null,
        $data['image'] ?? null,
        $data['badge'] ?? null,
        $data['badgeColor'] ?? null,
        $data['gradient'] ?? null,
        $data['section'],
        $data['recurrence'] ?? 'none',
        $data['display_order'] ?? 0,
        $status,
        $user['userId']
    ]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al crear evento: ' . $e->getMessage()]);
}
?>
