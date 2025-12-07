<?php
// api_php/auth/register.php
require_once '../cors.php';
require_once '../db.php';
require_once '../utils/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

// Basic validation
if (!isset($data->email) || !isset($data->password) || !isset($data->username)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fields']);
    exit;
}

$email = filter_var($data->email, FILTER_SANITIZE_EMAIL);
$username = htmlspecialchars($data->username);
$password = $data->password;

// Check if user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
$stmt->execute([$email, $username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'User already exists']);
    exit;
}

// Hash password
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'user')");
    $stmt->execute([$username, $email, $passwordHash]);
    
    $userId = $pdo->lastInsertId();

    // Generate token immediately for auto-login
    $tokenPayload = [
        'userId' => $userId,
        'email' => $email,
        'role' => 'user',
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60)
    ];
    $token = JWT::encode($tokenPayload);

    http_response_code(201);
    echo json_encode([
        'message' => 'User registered',
        'token' => $token,
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email,
            'role' => 'user'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
}
?>
