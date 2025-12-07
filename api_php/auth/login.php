<?php
// api_php/auth/login.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required']);
    exit;
}

$email = filter_var($data->email, FILTER_SANITIZE_EMAIL);

try {
    $stmt = $pdo->prepare("SELECT id, username, email, password_hash, role, is_verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Verify user exists and password is correct (using PHP's password_verify for bcrypt)
    // Note: Node.js bcrypt and PHP password_hash are compatible if using standard algorithms.
    if ($user && password_verify($data->password, $user['password_hash'])) {
        
        // Check verification if required (optional based on your old logic, implementing leniently here)
        // if (!$user['is_verified']) { ... }

        $tokenPayload = [
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ];

        $token = JWT::encode($tokenPayload);

        echo json_encode([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);

    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
