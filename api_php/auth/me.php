<?php
// api_php/auth/me.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = null;

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

$decoded = JWT::decode($token);

if (!$decoded) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

// Token is valid, return user info
// In a real app, you might query DB again to ensure user wasn't deleted/banned
echo json_encode([
    'user' => [
        'id' => $decoded['userId'],
        'email' => $decoded['email'],
        'role' => $decoded['role']
    ]
]);
?>
