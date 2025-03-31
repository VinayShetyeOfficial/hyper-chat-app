<?php
session_start();
include_once "config.php";

$searchTerm = trim(mysqli_real_escape_string($conn, $_POST["searchTerm"]));
$output = "";

$sql = mysqli_query($conn,"SELECT * FROM users WHERE (fname LIKE '%{$searchTerm}%' OR lname LIKE '%{$searchTerm}%' OR CONCAT(fname,' ',lname) LIKE '%{$searchTerm}%') AND unique_id != {$_SESSION["unique_id"]}");

if (mysqli_num_rows($sql) == 0) {
    $output = "No result found!";
} elseif (mysqli_num_rows($sql) > 0) {
    // Do something with the query results
    include "data.php";
}

echo $output;
