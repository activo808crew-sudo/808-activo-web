<?php
// api_php/audit/list.php
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

// Only admins/directors/owners should see audit logs
if (!$user || !in_array($user['role'], ['admin', 'owner', 'director'])) {
    http_response_code(403);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

try {
    $sql = "SELECT 
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.details,
        a.ip_address,
        a.created_at,
        u.username as user_name,
        u.email as user_email,
        u.role as user_role
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 100";

    $stmt = $pdo->query($sql);
    $logs = $stmt->fetchAll();

    echo json_encode(['success' => true, 'logs' => $logs]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
