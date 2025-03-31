<?php

session_start();
include_once "config.php";
$email = mysqli_real_escape_string($conn, $_POST["email"]);
$password = mysqli_real_escape_string($conn, $_POST["password"]);

if (!empty($email) && !empty($password)) {
    // let's check if the user enter credentials match with any of the records from the database
    $sql = mysqli_query($conn, "SELECT * FROM users WHERE email = '{$email}' AND password = '{$password}'");
    if (mysqli_num_rows($sql) > 0) {
        $row = mysqli_fetch_assoc($sql);
        $_SESSION["unique_id"] = $row["unique_id"]; // using this session we use users uique id in other php files

        mysqli_query($conn,$sql = "UPDATE users SET status = 'Active now' WHERE email  = '{$email}'");

        echo "success";
    } else {
        echo "Email or Password is incorrect!";
    }
} else {
    echo "All input fields are required";
}

?>
