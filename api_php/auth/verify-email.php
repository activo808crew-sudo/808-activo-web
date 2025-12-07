<?php
// api_php/auth/verify-email.php
require_once '../cors.php';
require_once '../db.php';

// NOTE: This logic mimics the Node.js version which verified a token.
// Since we don't have the sophisticated email sending logic ported yet (PHPMailer is heavy),
// this is a placeholder that accepts the token if valid in DB.
// You will need to install PHPMailer or similar if you want real emails later.

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$token = $_GET['token'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Token required']);
    exit;
}

try {
    // Check if token exists and belongs to a user? 
    // Node logic: verifyVerificationToken(token) -> checks DB for verification_token
    // Assuming 'verification_token' column exists in users table.

    $stmt = $pdo->prepare("SELECT id FROM users WHERE verification_token = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if ($user) {
        $update = $pdo->prepare("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?");
        $update->execute([$user['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Email verificado']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Token inválido o expirado']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
