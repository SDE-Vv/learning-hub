<?php
// Update Series (Admin Only)
require_once '../config/database.php';
require_once '../auth/verify_token.php';

header('Content-Type: application/json');

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Verify admin token
$user = verifyToken();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (!isset($data->id)) {
    sendResponse(false, "Series ID is required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Build update query dynamically based on provided fields
    $updateFields = [];
    $params = [':id' => $data->id];
    
    if (isset($data->code)) {
        $updateFields[] = "code = :code";
        $params[':code'] = $data->code;
    }
    if (isset($data->name)) {
        $updateFields[] = "name = :name";
        $params[':name'] = $data->name;
    }
    if (isset($data->icon)) {
        $updateFields[] = "icon = :icon";
        $params[':icon'] = $data->icon;
    }
    if (isset($data->display_order)) {
        $updateFields[] = "display_order = :display_order";
        $params[':display_order'] = $data->display_order;
    }
    if (isset($data->is_active)) {
        $updateFields[] = "is_active = :is_active";
        $params[':is_active'] = $data->is_active;
    }
    
    if (empty($updateFields)) {
        sendResponse(false, "No fields to update", null, 400);
    }
    // If code is being changed, ensure it won't conflict with another series
    if (isset($data->code)) {
        $checkQuery = "SELECT id FROM series WHERE code = :code AND id != :id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':code', $data->code);
        $checkStmt->bindParam(':id', $data->id, PDO::PARAM_INT);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            sendResponse(false, "Series code already in use by another series", null, 409);
        }
    }
    
    $query = "UPDATE series SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    if ($stmt->execute()) {
        sendResponse(true, "Series updated successfully");
    } else {
        sendResponse(false, "Failed to update series", null, 500);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
