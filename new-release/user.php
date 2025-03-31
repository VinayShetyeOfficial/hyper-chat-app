<?php
session_start();
if (!isset($_SESSION["unique_id"])) {
    header("location: login.php");
    exit();
}
?>

<?php include_once "header.php"; ?>
<body>
    <div class="wrapper">
        <section class="users">
            <header>
                <div class="content">
                    <img src="<?php echo $_SESSION['img']; ?>" alt="">
                    <div class="details-user">
                        <span><?php echo $_SESSION['fname'] . " " . $_SESSION['lname']; ?></span>
                        <p><?php echo $_SESSION['status']; ?></p>
                    </div>
                </div>
                <a href="#" onclick="handleLogout('php/logout.php?logout_id=<?php echo $_SESSION['unique_id']; ?>')" class="logout">Logout</a>
            </header>
            <div class="search">
                <span class="text">Search for a user...</span>
                <input type="text" placeholder="Enter name to search...">
                <button><i class="fas fa-search"></i></button>
            </div>
            <div class="users-list">
                <!-- Users will be loaded here dynamically -->
            </div>
        </section>
    </div>

    <script src="./js/firebase-auth.js"></script>
    <script src="./js/logout.js"></script>
    <script src="./js/users.js"></script>
    <script>
        const currentUserId = "<?php echo $_SESSION['unique_id']; ?>";
    </script>
</body>

</html>