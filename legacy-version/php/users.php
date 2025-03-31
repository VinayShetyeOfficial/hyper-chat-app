<?php

session_start();
include_once "config.php";
$outgoing_id = $_SESSION["unique_id"];
$sql = mysqli_query($conn, "SELECT users.*, COUNT(messages.msg_id) as message_count
                    FROM users
                    LEFT JOIN messages ON (messages.incomming_msg_id = users.unique_id OR messages.outgoing_msg_id = users.unique_id)
                    WHERE users.unique_id != {$_SESSION["unique_id"]}
                    GROUP BY users.id
                    ORDER BY
                    CASE
                    WHEN COUNT(messages.msg_id) > 0 THEN MAX(messages.timestamp)
                    ELSE 0
                    END DESC");

$output = "";

if (mysqli_num_rows($sql) == 1) {
    $output = "No users are available to chat";
} elseif (mysqli_num_rows($sql) > 0) {
    include "data.php";
}

echo $output;

?>
