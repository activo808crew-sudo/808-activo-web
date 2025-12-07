<?php
// api_php/events/list-dashboard.php
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

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

try {
    $section = $_GET['section'] ?? null;
    
    // Select specific fields + created_by (which public list didn't have)
    $sql = "SELECT 
        id,
        title,
        description,
        badge,
        badge_color as badgeColor,
        image_url as image,
        gradient,
        section,
        display_order,
        status,
        created_at,
        created_by,
        start_date,
        start_time,
        recurrence
    FROM events WHERE is_active = TRUE";

    if ($section && in_array($section, ['main', 'minecraft'])) {
        $sql .= " AND section = " . $pdo->quote($section);
    }

    $sql .= " ORDER BY display_order ASC, created_at DESC";

    $stmt = $pdo->query($sql);
    $events = $stmt->fetchAll();

    echo json_encode(['success' => true, 'events' => $events]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
