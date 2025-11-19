<?php
// Delete Series (Admin Only)
require_once '../config/database.php';
require_once '../auth/verify_token.php';

header('Content-Type: application/json');

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Verify admin token
$user = verifyToken();

// Get series ID from query parameter
$series_id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($series_id)) {
    sendResponse(false, "Series ID is required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Delete series (CASCADE will delete associated files)
    $query = "DELETE FROM series WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $series_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            sendResponse(true, "Series deleted successfully");
        } else {
            sendResponse(false, "Series not found", null, 404);
        }
    } else {
        sendResponse(false, "Failed to delete series", null, 500);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
