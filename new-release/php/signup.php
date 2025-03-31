<?php

session_start();

// Include database configuration
include_once "config.php";

// Check if mysqli is available and connection is successful
if (!isset($conn) || $conn === false) {
    // Return a specific error code that the JavaScript can recognize
    echo "database_unavailable";
    exit;
}

// Process form data
if (isset($_POST['fname']) && isset($_POST['lname']) && isset($_POST['email']) && isset($_POST['password'])) {
    $fname = mysqli_real_escape_string($conn, $_POST["fname"]);
    $lname = mysqli_real_escape_string($conn, $_POST["lname"]);
    $email = mysqli_real_escape_string($conn, $_POST["email"]);
    $password = mysqli_real_escape_string($conn, $_POST["password"]);

    if (!empty($fname) && !empty($lname) && !empty($email) && !empty($password)) {
        // Check if the email is valid
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // Check if the email already exists in the database
            $sql = mysqli_query($conn, "SELECT * FROM users WHERE email = '{$email}'");
            if (mysqli_num_rows($sql) > 0) {
                echo "$email - This email already exists!";
            } else {
                // Check if the user uploaded a file
                if (isset($_FILES["image"]) && $_FILES["image"]["error"] == 0) {
                    $img_name = $_FILES["image"]["name"];
                    $img_type = $_FILES["image"]["type"];
                    $tmp_name = $_FILES["image"]["tmp_name"];

                    // Get file extension
                    $img_explode = explode(".", $img_name);
                    $img_ext = end($img_explode);

                    $extension = ["png", "jpeg", "jpg"];
                    if (in_array(strtolower($img_ext), $extension)) {
                        $time = time();
                        $new_img_name = $time . "_" . $img_name;
                        
                        // Create directory if it doesn't exist
                        $upload_dir = "../img/uploads/";
                        if (!file_exists($upload_dir)) {
                            mkdir($upload_dir, 0777, true);
                        }
                        
                        if (move_uploaded_file($tmp_name, $upload_dir . $new_img_name)) {
                            $status = "Active now";
                            $random_id = rand(time(), 10000000);

                            // Insert user data into database
                            $sql2 = mysqli_query($conn, "INSERT INTO users(unique_id, fname, lname, email, password, img, status) 
                                                         VALUES
                                                        ('{$random_id}','{$fname}', '{$lname}', '{$email}' ,'{$password}', '{$new_img_name}', '{$status}')");

                            if ($sql2) {
                                $sql3 = mysqli_query($conn, "SELECT * FROM users WHERE email = '{$email}'");
                                if (mysqli_num_rows($sql3) > 0) {
                                    $row = mysqli_fetch_assoc($sql3);
                                    $_SESSION["unique_id"] = $row["unique_id"];
                                    echo "success";
                                }
                            } else {
                                echo "Database error: " . mysqli_error($conn);
                            }
                        } else {
                            echo "Failed to upload image. Error: " . $_FILES["image"]["error"];
                        }
                    } else {
                        echo "Please select an image file - png, jpg, jpeg";
                    }
                } else {
                    echo "Please select an image file!";
                }
            }
        } else {
            echo "$email - This is not a valid email address!";
        }
    } else {
        echo "All input fields are required!";
    }
} else {
    echo "All input fields are required!";
}
