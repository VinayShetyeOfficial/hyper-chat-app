<?php
session_start();
if (!isset($_SESSION["unique_id"])) {
    header("location: login.php");
}
?>

<?php include_once "header.php"; ?>

<body>
    <div class="wrapper">
        <section class="chat-area">
            <?php
            include_once "php/config.php";
            $user_id = mysqli_real_escape_string($conn, $_GET["user_id"]);
            $sql = mysqli_query($conn, "SELECT * FROM users WHERE unique_id = '{$user_id}'");

            if (mysqli_num_rows($sql) > 0) {
                $row = mysqli_fetch_assoc($sql);
            }

            $sql = "UPDATE messages SET msg_status = 'seen' WHERE outgoing_msg_id = {$user_id} AND incomming_msg_id = {$_SESSION["unique_id"]}";
            mysqli_query($conn, $sql);
            ?>
            <header>
                <a href="user.php" class="back-icon"><i class="fas fa-arrow-left"></i></a>
                <img src="./img/uploads/<?php echo $row["img"]; ?>" alt="">
                <div class="details">
                    <span><?php echo $row["fname"] ." " .$row["lname"]; ?></span>
                    <p>Active now</p>
                </div>
            </header>
            <div class="chat-box">

            </div>
            <form action="#" class="typing-area" autocomplete="off">
                <input type="hidden" name="outgoing_id" value="<?php echo $_SESSION["unique_id"]; ?>">
                <input type="hidden" name="incomming_id" value="<?php echo $user_id; ?>">
                <input type="text" name="message" class="input-field" placeholder="Type a message here...">
                <button id="send"><i class="fab fa-telegram-plane"></i></button>
            </form>
        </section>
    </div>

    <script src="./js/chat.js"></script>
</body>

</html>

