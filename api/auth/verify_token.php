<?php
// Verify JWT Token Middleware
require_once '../config/jwt.php';

function verifyToken() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No token provided']);
        exit();
    }
    
    $authHeader = $headers['Authorization'];
    $arr = explode(" ", $authHeader);
    
    if (count($arr) != 2 || $arr[0] != 'Bearer') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token format']);
        exit();
    }
    
    $jwt = $arr[1];
    $decoded = JWT::decode($jwt);
    
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token']);
        exit();
    }
    
    return $decoded;
}
?>
