<?php
// Create New File (Admin Only)
require_once '../config/database.php';
require_once '../auth/verify_token.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Verify admin token
$user = verifyToken();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (!isset($data->series_code) || !isset($data->file_number) || !isset($data->title) || !isset($data->content)) {
    sendResponse(false, "series_code, file_number, title, and content are required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get series ID from code
    $seriesQuery = "SELECT id FROM series WHERE code = :code";
    $seriesStmt = $db->prepare($seriesQuery);
    $seriesStmt->bindParam(':code', $data->series_code);
    $seriesStmt->execute();
    
    if ($seriesStmt->rowCount() === 0) {
        sendResponse(false, "Series not found", null, 404);
    }
    
    $series = $seriesStmt->fetch(PDO::FETCH_ASSOC);
    $series_id = $series['id'];
    
    // Check if file with this number already exists for this series
    $checkQuery = "SELECT id FROM files WHERE series_id = :series_id AND file_number = :file_number";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':series_id', $series_id);
    $checkStmt->bindParam(':file_number', $data->file_number);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        sendResponse(false, "File with this number already exists for this series", null, 409);
    }
    
    // Insert new file
    $query = "INSERT INTO files (series_id, file_number, title, content, display_order, is_active) 
              VALUES (:series_id, :file_number, :title, :content, :display_order, :is_active)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':series_id', $series_id, PDO::PARAM_INT);
    $stmt->bindParam(':file_number', $data->file_number, PDO::PARAM_INT);
    $stmt->bindParam(':title', $data->title);
    $stmt->bindParam(':content', $data->content);
    
    $display_order = isset($data->display_order) ? $data->display_order : $data->file_number;
    $stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
    
    $is_active = isset($data->is_active) ? $data->is_active : true;
    $stmt->bindParam(':is_active', $is_active, PDO::PARAM_BOOL);
    
    if ($stmt->execute()) {
        sendResponse(true, "File created successfully", ['id' => $db->lastInsertId()], 201);
    } else {
        sendResponse(false, "Failed to create file", null, 500);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
