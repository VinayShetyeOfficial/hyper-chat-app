<?php
session_start();
if (isset($_SESSION["unique_id"])) {
    header("location: user.php");
    exit();
}
include_once "header.php"; ?>

<body>
    <div class="wrapper">
        <section class="form login">
            <header>
                <div class="logo-container">
                    <img src="./assets/logo.png" alt="HyperChat Logo" class="logo">
                </div>
                <h1>HyperChat</h1>
            </header>
            <form action="#">
                <div class="error-txt"></div>
                <div class="field input">
                    <label>Email Address</label>
                    <input type="text" name="email" placeholder="Enter your email">
                </div>
                <div class="field input">
                    <label>Password</label>
                    <input type="password" name="password" placeholder="Enter your password" maxlength="16">
                    <i class="fas fa-eye eye-icon"></i>
                </div>
                <div class="field button">
                    <input type="submit" value="Continue to Chat">
                </div>
            </form>
            <div class="link">Not yet signed up? <a href="index.php">Signup now</a></div>
        </section>
    </div>

    <script src="./js/pass-show-hide.js"></script>
    <script src="./js/firebase-auth.js"></script>
    <script src="./js/login.js"></script>
</body>

</html>