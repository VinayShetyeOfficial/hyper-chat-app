<?php
session_start();

if (isset($_POST['uid']) && isset($_POST['email']) && isset($_POST['fname']) && isset($_POST['lname'])) {
    // For signup, we'll just confirm success without setting the session
    if (isset($_POST['isSignup']) && $_POST['isSignup'] === 'true') {
        echo "success";
        return;
    }
    
    // For login, set the session
    $_SESSION["unique_id"] = $_POST['uid'];
    $_SESSION["email"] = $_POST['email'];
    $_SESSION["fname"] = $_POST['fname'];
    $_SESSION["lname"] = $_POST['lname'];
    $_SESSION["img"] = $_POST['profileImageURL'] ?? '';  // Make profileImageURL optional
    $_SESSION["status"] = "Online"; // Use "Online" consistently
    
    // Debug logging
    error_log("Session data set: " . print_r($_SESSION, true));
    
    echo "success";
} else {
    error_log("Missing fields: " . print_r($_POST, true));
    echo "Missing required fields";
}
?> 