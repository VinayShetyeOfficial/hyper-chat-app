<?php
while ($row = mysqli_fetch_assoc($sql)) {
    $sql2 = "SELECT * FROM messages WHERE (incomming_msg_id = {$row["unique_id"]} OR outgoing_msg_id = {$row["unique_id"]}) AND (outgoing_msg_id = {$_SESSION["unique_id"]} OR incomming_msg_id = {$_SESSION["unique_id"]}) ORDER BY msg_id DESC LIMIT 1";

    $query2 = mysqli_query($conn, $sql2);

    $row2 = mysqli_fetch_assoc($query2);

    $result =
        mysqli_num_rows($query2) > 0 ? $row2["msg"] : "No message available";

    $msg = strlen($result) > 28 ? substr($result, 0, 28) . "..." : $result;

    $you = isset($row2["outgoing_msg_id"])
        ? ($_SESSION["unique_id"] == $row2["outgoing_msg_id"]? "You: " : "") : "";

    $offline = $row["status"] == "Offline now" ? "offline" : "";

    $hid_me = $_SESSION["unique_id"] == $row["unique_id"] ? "hide" : "";

    $concat = $you . $msg;

    $style = "";

    if (isset($row2["msg_status"])) {
        if ($row2["msg_status"] == "Not seen") {
            if (!str_contains($concat, "You: ")) {
                $style = 'style="color: #3838ff; font-weight: bold"';
            } else {
                $style = 'style="color: #f03838"';
            }
        }
    }

    $output .=
        '
            <a href="chat.php?user_id=' . $row["unique_id"] . '">
                <div class="content">
                <img src="img/uploads/' . $row["img"] . '" alt="">
                <div class="details">
                    <span>' . $row["fname"] . " " . $row["lname"] . '</span>
                    <p ' . $style . ">" . $you . $msg . '</p>
                </div>
                </div>
                <div class="status-dot ' . $offline . '"><i class="fas fa-circle"></i>
                </div>
            </a>
        ';
}
?>
