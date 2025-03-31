<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Debug logging
error_log("Session status: " . print_r($_SESSION, true));

// If user is logged in, redirect to user.php
if (isset($_SESSION["unique_id"])) {
    error_log("Redirecting to user.php - user is logged in");
    header("location: user.php");
    exit();
}

// If this is the root URL, redirect to login page
// Only redirect if directly accessing index.php without any referrer
if (($_SERVER['REQUEST_URI'] == '/' || $_SERVER['REQUEST_URI'] == '/index.php') 
    && (!isset($_SERVER['HTTP_REFERER']) || !strpos($_SERVER['HTTP_REFERER'], 'login.php'))) {
    error_log("Redirecting to login.php - new visitor");
    header("location: login.php");
    exit();
}

error_log("Showing signup page - user clicked signup");
?>

<?php include_once "header.php"; ?>
<body>
    <div class="wrapper">
        <section class="form signup" enctype="multipart/form-data">
            <header>
                <div class="logo-container">
                    <img src="./assets/logo.png" alt="HyperChat Logo" class="logo">
                </div>
                <h1>HyperChat</h1>
            </header>
            <form action="#">
                <div class="error-txt"></div>
                <div class="name-details">
                    <div class="field input">
                        <label>First Name</label>
                        <input type="text" placeholder="First Name" name="fname" required>
                    </div>
                    <div class="field input">
                        <label>Last Name</label>
                        <input type="text" placeholder="Last Name" name="lname" required>
                    </div>
                </div>
                <div class="field input">
                    <label>Email Address</label>
                    <input type="text" placeholder="Enter your email" name="email" required>
                </div>
                <div class="field input">
                    <label>Password</label>
                    <input type="password" placeholder="Enter new password" name="password" maxlength="16" required>
                    <i class="fas fa-eye eye-icon"></i>
                </div>
                <div class="field image">
                    <label>Select Image</label>
                    <label for="file-upload" class="custom-file-upload">
                        <div class="spinner"></div>
                        <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        <span class="upload-text">Choose a profile picture</span>
                    </label>
                    <input id="file-upload" type="file" name="image">
                </div>
                <div class="field button">
                    <input type="submit" value="Continue to Chat">
                </div>
            </form>
            <div class="link">Already signed up? <a href="login.php">Login now</a></div>
        </section>
    </div>

    <script src="./js/pass-show-hide.js"></script>
    <script src="./js/signup.js"></script>
    <script src="./js/file-upload.js"></script>
    <script src="./js/firebase-auth.js"></script>
</body>

</html>