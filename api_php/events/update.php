<?php
// api_php/events/update.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing ID']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

try {
    $fields = [];
    $params = [];

    // Map allowed fields
    $allowed = ['title', 'description', 'start_date', 'start_time', 'image_url', 'badge', 'badge_color', 'gradient', 'section', 'recurrence', 'display_order', 'status'];

    foreach ($allowed as $field) {
        // Handle alias from frontend 'image' -> 'image_url', 'badgeColor' -> 'badge_color'
        $inputKey = $field;
        if ($field === 'image_url') $inputKey = 'image';
        if ($field === 'badge_color') $inputKey = 'badgeColor';

        if (isset($data[$inputKey])) {
            $fields[] = "$field = ?";
            $params[] = $data[$inputKey];
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $params[] = $id;
    $sql = "UPDATE events SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al actualizar evento']);
}
?>
