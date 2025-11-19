<?php
// Update File (Admin Only)
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
    sendResponse(false, "File ID is required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Build update query dynamically based on provided fields
    $updateFields = [];
    $params = [':id' => $data->id];
    
    if (isset($data->title)) {
        $updateFields[] = "title = :title";
        $params[':title'] = $data->title;
    }
    if (isset($data->content)) {
        $updateFields[] = "content = :content";
        $params[':content'] = $data->content;
    }
    if (isset($data->file_number)) {
        $updateFields[] = "file_number = :file_number";
        $params[':file_number'] = $data->file_number;
    }
    // Allow moving file to a different series by series code
    if (isset($data->series_code)) {
        // Get series ID
        $seriesQuery = "SELECT id FROM series WHERE code = :series_code";
        $seriesStmt = $db->prepare($seriesQuery);
        $seriesStmt->bindParam(':series_code', $data->series_code);
        $seriesStmt->execute();

        if ($seriesStmt->rowCount() === 0) {
            sendResponse(false, "Series not found", null, 404);
        }

        $seriesRow = $seriesStmt->fetch(PDO::FETCH_ASSOC);
        $new_series_id = $seriesRow['id'];

        $updateFields[] = "series_id = :series_id";
        $params[':series_id'] = $new_series_id;
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

    // If file number or series is changing, ensure uniqueness within the target series
    if (isset($params[':file_number']) || isset($params[':series_id'])) {
        // Get the target series id: prefer provided series_id, else current series_id for this file
        $targetSeriesId = isset($params[':series_id']) ? $params[':series_id'] : null;

        if ($targetSeriesId === null) {
            $getCurrent = $db->prepare("SELECT series_id FROM files WHERE id = :id");
            $getCurrent->bindParam(':id', $data->id, PDO::PARAM_INT);
            $getCurrent->execute();
            $current = $getCurrent->fetch(PDO::FETCH_ASSOC);
            if (!$current) sendResponse(false, "File not found", null, 404);
            $targetSeriesId = $current['series_id'];
        }

        if (isset($params[':file_number'])) {
            $check = $db->prepare("SELECT id FROM files WHERE series_id = :series_id AND file_number = :file_number AND id != :id");
            $check->bindParam(':series_id', $targetSeriesId, PDO::PARAM_INT);
            $check->bindParam(':file_number', $params[':file_number'], PDO::PARAM_INT);
            $check->bindParam(':id', $data->id, PDO::PARAM_INT);
            $check->execute();

            if ($check->rowCount() > 0) {
                sendResponse(false, "File number already exists in target series", null, 409);
            }
        }
    }
    
    $query = "UPDATE files SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            sendResponse(true, "File updated successfully");
        } else {
            sendResponse(false, "File not found or no changes made", null, 404);
        }
    } else {
        sendResponse(false, "Failed to update file", null, 500);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Error: " . $e->getMessage(), null, 500);
}
?>
