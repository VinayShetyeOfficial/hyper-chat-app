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
        <section class="chat-area">
            <header>
                <?php
                include_once "php/config.php";
                $user_id = $_GET["user_id"];
                ?>
                <a href="user.php" class="back-icon"><i class="fas fa-arrow-left"></i></a>
                <img src="img/avatar.png" alt="" id="chat-user-img">
                <div class="details">
                    <span id="chat-user-name">&nbsp;</span>
                    <p id="chat-user-status">&nbsp;</p>
                </div>
            </header>
            <div class="chat-box">
                <!-- Chat messages will be loaded here -->
            </div>
            <form action="#" class="typing-area" autocomplete="off">
                <input type="text" name="outgoing_id" value="<?php echo $_SESSION['unique_id']; ?>" hidden>
                <input type="text" name="incoming_id" value="<?php echo $user_id; ?>" hidden>
                <input type="text" name="message" class="input-field" placeholder="Type a message here...">
                <button><i class="fab fa-telegram-plane"></i></button>
            </form>
        </section>
    </div>

    <script src="./js/firebase-init.js"></script>
    <script src="./js/firebase-auth.js"></script>
    <script src="./js/chat.js"></script>
    <script>
        const currentUserId = "<?php echo $_SESSION['unique_id']; ?>";
        const chatUserId = "<?php echo $user_id; ?>";
    </script>
</body>

</html>

