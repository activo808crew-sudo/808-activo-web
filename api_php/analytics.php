<?php
// api_php/analytics.php
require_once 'cors.php';
require_once 'db.php';

// Note: db.php creates connection ($pdo) but doesn't auto-create tables like Node version did.
// We should assume tables exist or handle initialization separately (via SQL import).
// For now, we assume tables 'shop_users' and 'shop_events' are created.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $type = $input['type'] ?? null;
    $data = $input['data'] ?? [];

    if ($type === 'login') {
        $username = $data['username'] ?? null;
        if ($username) {
            $stmt = $pdo->prepare("INSERT INTO shop_users (username) VALUES (?) ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP");
            $stmt->execute([$username]);
            echo json_encode(['success' => true]);
            exit;
        }
    }

    if ($type === 'event') {
        $username = $data['username'] ?? 'anonymous';
        $item_price = $data['item_price'] ?? 0;
        
        $stmt = $pdo->prepare("INSERT INTO shop_events (username, event_type, item_id, item_name, item_price) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $username,
            $data['event_type'],
            $data['item_id'],
            $data['item_name'],
            $item_price
        ]);
        echo json_encode(['success' => true]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get featured items
    $sql = "SELECT 
              item_id, 
              item_name, 
              COUNT(*) as popularity_score 
            FROM shop_events 
            WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND event_type IN ('add_to_cart', 'purchase')
            GROUP BY item_id, item_name 
            ORDER BY popularity_score DESC 
            LIMIT 6";
    
    try {
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll();
        echo json_encode(['featured' => $rows]);
    } catch (PDOException $e) {
        // Table might missing if not migrated
        echo json_encode(['featured' => []]);
    }
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
?>
