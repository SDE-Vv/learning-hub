<?php
// Database configuration and connection
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Database {
    // Database credentials - Change these for production
    // private $host = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com";
    // private $port = "4000";
    // private $db_name = "learning_hub";
    // private $username = "4Uz6v3SMYcmcoMk.root";
    // private $password = "53RXwUdNakEbByo4";
    // public $conn;

    private $host = "db";
    private $port = "3306";
    private $db_name = "learning_hub";
    private $username = "root";
    private $password = "root";


    // Get database connection
    public function getConnection() {
    $this->conn = null;

    try {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_SSL_CA => __DIR__ . "/ca.pem",   // 👈 Add CA file
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false, // 👈 Required for TiDB Cloud
        ];

        $this->conn = new PDO(
            "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4",
            $this->username,
            $this->password,
            $options
        );
    } catch(PDOException $exception) {
        echo json_encode([
            "success" => false,
            "message" => "Connection error: " . $exception->getMessage()
        ]);
        exit();
    }

    return $this->conn;
}


    // For Render.com or other platforms, use environment variables
    public static function getConnectionFromEnv() {
        $host = getenv('DB_HOST') ?: 'localhost';
        $db_name = getenv('DB_NAME') ?: 'learning_hub';
        $username = getenv('DB_USER') ?: 'root';
        $password = getenv('DB_PASSWORD') ?: '';
        
        try {
            $conn = new PDO(
                "mysql:host=" . $host . ";dbname=" . $db_name,
                $username,
                $password
            );
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $conn->exec("set names utf8");
            return $conn;
        } catch(PDOException $exception) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Database connection failed"
            ]);
            exit();
        }
    }
}

// Helper function to send JSON response
function sendResponse($success, $message = "", $data = null, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    
    $response = ["success" => $success];
    
    if ($message) {
        $response["message"] = $message;
    }
    
    if ($data !== null) {
        $response["data"] = $data;
    }
    
    echo json_encode($response);
    exit();
}
?>
