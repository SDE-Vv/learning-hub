<?php
// CLI-only script to reset admin credentials
// Usage: php scripts/reset_admin_cli.php --username=admin --password=admin123 --yes
// If you run without --yes, the script will pause and ask for confirmation.

// DB config is in ../api/config relative to scripts folder
$dbPath = __DIR__ . '/../api/config/database.php';
if (!file_exists($dbPath)) {
    fwrite(STDERR, "Error: Could not find database config at $dbPath\n");
    exit(1);
}
require_once $dbPath;

$options = getopt('', ['username::', 'password::', 'yes::']);

$username = isset($options['username']) ? $options['username'] : 'admin';
$passwordPlain = isset($options['password']) ? $options['password'] : 'admin123';
$force = isset($options['yes']);

echo "\n*** Reset Admin CLI Script ***\n";
if (!$force) {
    echo "Warning: This will set admin username to '$username' and password to '$passwordPlain'.\n";
    echo "Type 'yes' to continue: ";
    $handle = fopen('php://stdin', 'r');
    $line = trim(fgets($handle));
    fclose($handle);
    if (strtolower($line) !== 'yes') {
        echo "Aborted by user.\n";
        exit(1);
    }
}

try {
    $db = (new Database())->getConnection();
    $passwordHash = password_hash($passwordPlain, PASSWORD_BCRYPT);

    // Try to update id 1
    $updateStmt = $db->prepare("UPDATE admin_users SET username = :username, password_hash = :password_hash WHERE id = 1");
    $updateStmt->bindParam(':username', $username);
    $updateStmt->bindParam(':password_hash', $passwordHash);
    $updateStmt->execute();

    if ($updateStmt->rowCount() > 0) {
        echo "Success: Admin (id=1) updated with new credentials.\n";
        exit(0);
    }

    // Update first active admin
    $updateAny = $db->prepare("UPDATE admin_users SET username = :username, password_hash = :password_hash WHERE is_active = 1 LIMIT 1");
    $updateAny->bindParam(':username', $username);
    $updateAny->bindParam(':password_hash', $passwordHash);
    $updateAny->execute();

    if ($updateAny->rowCount() > 0) {
        echo "Success: Updated an active admin.\n";
        exit(0);
    }

    // Insert new admin
    $insertStmt = $db->prepare("INSERT INTO admin_users (username, password_hash, email) VALUES (:username, :password_hash, :email)");
    $email = 'admin@example.com';
    $insertStmt->bindParam(':username', $username);
    $insertStmt->bindParam(':password_hash', $passwordHash);
    $insertStmt->bindParam(':email', $email);
    $insertStmt->execute();

    echo "Success: Created new admin user.\n";
    exit(0);
} catch (PDOException $e) {
    fwrite(STDERR, "Database error: " . $e->getMessage() . "\n");
    exit(2);
}
?>