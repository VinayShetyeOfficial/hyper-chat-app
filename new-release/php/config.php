<?php
// Check if mysqli extension is available
if (!extension_loaded('mysqli')) {
    // If mysqli is not available, create a mock connection that will gracefully fail
    $conn = false;
    
    // Log the error (optional)
    error_log("MySQLi extension is not enabled. Please enable it in your PHP configuration.");
    
    // Return early - the calling code should check if $conn is false
    return;
}

// If we get here, mysqli is available
try {
    // Database connection parameters - using Docker credentials
    $hostname = "db"; // Docker service name
    $username = "chatuser";
    $password = "chatpassword";
    $dbname = "chatapp";

    // Create connection
    $conn = mysqli_connect($hostname, $username, $password, $dbname);

    // Check connection
    if (!$conn) {
        // Log the error (optional)
        error_log("Database connection failed: " . mysqli_connect_error());
        $conn = false;
    }
} catch (Exception $e) {
    // Log the error (optional)
    error_log("Exception in database connection: " . $e->getMessage());
    $conn = false;
}
?>