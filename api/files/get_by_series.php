<?php
// Get Files by Series Code (Public API)
require_once '../config/database.php';

header('Content-Type: application/json');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Get series code from query parameter
$series_code = isset($_GET['series']) ? $_GET['series'] : '';

if (empty($series_code)) {
    sendResponse(false, "Series code is required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // First, get series ID
    $query = "SELECT id FROM series WHERE code = :code AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $series_code);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        sendResponse(false, "Series not found", null, 404);
    }
    
    $series = $stmt->fetch(PDO::FETCH_ASSOC);
    $series_id = $series['id'];
    
    // Get all files for this series
    $query = "SELECT id, file_number, title, display_order 
              FROM files 
              WHERE series_id = :series_id AND is_active = 1 
              ORDER BY display_order ASC, file_number ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':series_id', $series_id);
    $stmt->execute();
    
    $files = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $files[] = [
            'id' => (int)$row['id'],
            'number' => (int)$row['file_number'],
            'title' => $row['title'],
            'order' => (int)$row['display_order']
        ];
    }
    
    sendResponse(true, "Files retrieved successfully", [
        'series' => $series_code,
        'files' => $files
    ]);
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
