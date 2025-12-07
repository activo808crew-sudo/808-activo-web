<?php
// api_php/streams.php
require_once 'cors.php';
require_once 'db.php';

// Allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    // Determine sort order
    $sort = $_GET['sort'] ?? 'online';
    
    // Base query
    $sql = "SELECT id, channel_id as login, name, platform, is_online, profile_image_url as avatar, bio as description, last_stream_check, created_at 
            FROM streamers";
    
    if ($sort === 'online') {
        $sql .= " ORDER BY is_online DESC, name ASC";
    } else {
        $sql .= " ORDER BY name ASC";
    }

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();

    $results = [];
    foreach ($rows as $row) {
        $results[] = [
            'id' => $row['id'],
            'login' => $row['login'], // channel_id mapped to login
            'name' => $row['name'],
            'avatar' => $row['avatar'],
            'url' => "https://twitch.tv/" . $row['login'],
            'status' => $row['is_online'] ? 'live' : 'offline',
            'game' => null, // Basic version doesn't save game to DB yet
            'title' => null,
            'thumbnail' => null,
            'viewers' => 0,
            'description' => $row['description']
        ];
    }

    echo json_encode(['data' => $results]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
