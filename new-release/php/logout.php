<?php
session_start();
if (isset($_SESSION["unique_id"])) {
    // Clear all session variables
    session_unset();
    // Destroy the session
    session_destroy();
    // Redirect to login page
    header("location: ../login.php");
    exit();
} else {
    header("location: ../login.php");
    exit();
}
?>
