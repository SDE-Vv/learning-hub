<?php
// Create New Series (Admin Only)
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
if (!isset($data->code) || !isset($data->name)) {
    sendResponse(false, "Code and name are required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if series with this code already exists
    $checkQuery = "SELECT id FROM series WHERE code = :code";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':code', $data->code);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        sendResponse(false, "Series with this code already exists", null, 409);
    }
    
    // Insert new series
    $query = "INSERT INTO series (code, name, icon, display_order, is_active) 
              VALUES (:code, :name, :icon, :display_order, :is_active)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $data->code);
    $stmt->bindParam(':name', $data->name);
    
    $icon = isset($data->icon) ? $data->icon : 'ri-code-line';
    $stmt->bindParam(':icon', $icon);
    
    $display_order = isset($data->display_order) ? $data->display_order : 0;
    $stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
    
    $is_active = isset($data->is_active) ? $data->is_active : true;
    $stmt->bindParam(':is_active', $is_active, PDO::PARAM_BOOL);
    
    if ($stmt->execute()) {
        sendResponse(true, "Series created successfully", ['id' => $db->lastInsertId()], 201);
    } else {
        sendResponse(false, "Failed to create series", null, 500);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
