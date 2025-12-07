<?php
// api_php/auth/resend-verification.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));
$email = $data->email ?? null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email required']);
    exit;
}

try {
    // Just generate a new token and save it.
    // Email sending is skipped for now - user needs to set up PHP mail().
    
    $token = bin2hex(random_bytes(16));
    
    $stmt = $pdo->prepare("UPDATE users SET verification_token = ? WHERE email = ? AND is_verified = FALSE");
    $stmt->execute([$token, $email]);

    if ($stmt->rowCount() > 0) {
        // Here you would call mail(...)
        echo json_encode(['success' => true, 'message' => 'Verification email sent (simulated)']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found or already verified']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
