<?php
// api_php/streamers/list.php
// This is the STAFF version (see StaffDashboard.jsx fetching /api/streamers/list)
require_once '../cors.php';
require_once '../db.php';

// Note: StaffDashboard doesn't send auth header in the analyzed code snippet for this specific call?
// Wait, snippet line 97: const res = await fetch('/api/streamers/list'); (No auth header?)
// But typically this list is used for management. Node version didn't check auth either! 
// We will replicate Node logic (publicly accessible list of all data).

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT * FROM streamers ORDER BY is_live DESC, created_at ASC");
    $rows = $stmt->fetchAll();

    // Node version returned raw rows.
    echo json_encode($rows);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>
