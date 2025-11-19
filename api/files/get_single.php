<?php
// Get Single File Content (Public API)
require_once '../config/database.php';

header('Content-Type: application/json');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Get parameters
$series_code = isset($_GET['series']) ? $_GET['series'] : '';
$file_number = isset($_GET['number']) ? $_GET['number'] : '';

if (empty($series_code) || $file_number === '') {
    sendResponse(false, "Series code and file number are required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get file content with join
    $query = "SELECT f.id, f.file_number, f.title, f.content 
              FROM files f
              JOIN series s ON f.series_id = s.id
              WHERE s.code = :code 
              AND f.file_number = :file_number 
              AND f.is_active = 1 
              AND s.is_active = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $series_code);
    $stmt->bindParam(':file_number', $file_number, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        sendResponse(false, "File not found", null, 404);
    }
    
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $fileData = [
        'id' => (int)$row['id'],
        'number' => (int)$row['file_number'],
        'title' => $row['title'],
        'content' => $row['content']
    ];
    
    sendResponse(true, "File retrieved successfully", $fileData);
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
