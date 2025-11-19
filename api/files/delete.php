<?php
// Delete File (Admin Only)
require_once '../config/database.php';
require_once '../auth/verify_token.php';

header('Content-Type: application/json');

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Verify admin token
$user = verifyToken();

// Get file ID from query parameter
$file_id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($file_id)) {
    sendResponse(false, "File ID is required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Delete file
    $query = "DELETE FROM files WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $file_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            sendResponse(true, "File deleted successfully");
        } else {
            sendResponse(false, "File not found", null, 404);
        }
    } else {
        sendResponse(false, "Failed to delete file", null, 500);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
