<?php
// Admin Login API
require_once '../config/database.php';
require_once '../config/jwt.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, "Method not allowed", null, 405);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (!isset($data->username) || !isset($data->password)) {
    sendResponse(false, "Username and password are required", null, 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Query user
    $query = "SELECT id, username, password_hash, email FROM admin_users WHERE username = :username AND is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $data->username);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password
        if (password_verify($data->password, $row['password_hash'])) {
            // Create JWT token
            $payload = [
                'iss' => 'learning-hub',
                'iat' => time(),
                'exp' => time() + (60 * 60 * 24), // 24 hours
                'user_id' => $row['id'],
                'username' => $row['username']
            ];
            
            $jwt = JWT::encode($payload);
            
            sendResponse(true, "Login successful", [
                'token' => $jwt,
                'username' => $row['username'],
                'email' => $row['email']
            ]);
        } else {
            sendResponse(false, "Invalid username or password", null, 401);
        }
    } else {
        sendResponse(false, "Invalid username or password", null, 401);
    }
    
} catch(Exception $e) {
    sendResponse(false, "Login failed: " . $e->getMessage(), null, 500);
}
?>
