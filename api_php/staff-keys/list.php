<?php
// api_php/staff-keys/list.php
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
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

$user = JWT::decode($token);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

// Role Check
if (!in_array($user['role'], ['director', 'owner'])) {
    http_response_code(403);
    echo json_encode(['error' => 'No tienes permisos']);
    exit;
}

try {
    $sql = "SELECT 
        sk.id,
        sk.key_value,
        sk.is_used,
        sk.expires_at,
        sk.created_at,
        sk.used_at,
        creator.email as created_by_email,
        user.email as used_by_email,
        CASE
          WHEN sk.is_used THEN 'used'
          WHEN sk.expires_at < NOW() THEN 'expired'
          ELSE 'active'
        END as status
       FROM staff_keys sk
       LEFT JOIN users creator ON sk.created_by = creator.id
       LEFT JOIN users user ON sk.used_by = user.id
       ORDER BY sk.created_at DESC";
       
    // NOTE: Node code joined with 'staff_users' but PHP auth uses 'users' table. 
    // Assuming 'users' is the main table for all.

    $stmt = $pdo->query($sql);
    $staffKeys = $stmt->fetchAll();

    echo json_encode(['success' => true, 'staffKeys' => $staffKeys]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
