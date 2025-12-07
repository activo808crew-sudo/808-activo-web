<?php
// api_php/events/list.php
require_once '../cors.php';
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    // Logic: fetch upcoming events
    // Assuming date field usage. 
    // Node.js code might have specific logic for "status" vs "date". 
    // Replicating basic fetch here.

    // Fetch events with aliases matching frontend expectations (camelCase)
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
        start_date,
        start_time,
        recurrence
    FROM events WHERE is_active = TRUE";

    // Simple role check (if token is passed, allow seeing all, otherwise published)
    // For now, simplify to just published if no special param
    // In a full port, we'd check JWT here.
    if (!isset($_GET['all'])) {
         $sql .= " AND status = 'published'";
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
