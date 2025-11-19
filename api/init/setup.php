<?php
// Auto-setup script - Creates default admin user if not exists
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if admin user already exists
    $query = "SELECT COUNT(*) as count FROM admin_users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $username);
    $username = 'admin';
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] > 0) {
        // Admin already exists, skip creation
        echo json_encode([
            'success' => true,
            'message' => 'Admin user already exists',
            'created' => false
        ]);
        exit;
    }
    
    // Create default admin user
    $insertQuery = "INSERT INTO admin_users (username, password_hash, email) 
                    VALUES (:username, :password_hash, :email)";
    $insertStmt = $db->prepare($insertQuery);
    
    $adminUsername = 'admin';
    $adminPassword = password_hash('admin123', PASSWORD_BCRYPT);
    $adminEmail = 'admin@example.com';
    
    $insertStmt->bindParam(':username', $adminUsername);
    $insertStmt->bindParam(':password_hash', $adminPassword);
    $insertStmt->bindParam(':email', $adminEmail);
    
    if ($insertStmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Default admin user created successfully',
            'created' => true,
            'credentials' => [
                'username' => 'admin',
                'password' => 'admin123'
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create admin user'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
