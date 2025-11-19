<?php
// Get All Active Series (Public API)
require_once '../config/database.php';

header('Content-Type: application/json');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, "Method not allowed", null, 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Query all active series ordered by display_order
    // Include id so admin UI can perform update/delete actions
    $query = "SELECT id, code, name, icon, display_order 
              FROM series 
              WHERE is_active = 1 
              ORDER BY display_order ASC, name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $series = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $series[] = [
            'id' => (int)$row['id'],
            'code' => $row['code'],
            'name' => $row['name'],
            'icon' => $row['icon'],
            'order' => (int)$row['display_order']
        ];
    }
    
    sendResponse(true, "Series retrieved successfully", $series);
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
