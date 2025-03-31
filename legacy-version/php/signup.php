<?php

session_start();

include_once "config.php";
$fname = mysqli_real_escape_string($conn, $_POST["fname"]);
$lname = mysqli_real_escape_string($conn, $_POST["lname"]);
$email = mysqli_real_escape_string($conn, $_POST["email"]);
$password = mysqli_real_escape_string($conn, $_POST["password"]);

if (!empty($fname) && !empty($lname) && !empty($email) && !empty($password)) {
    // let's check if the email if valid
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        // if email if valid
        // let's check if the email already exist in the database or not
        $sql = mysqli_query($conn, "SELECT * from users WHERE email = '{$email}'");
        if (mysqli_num_rows($sql) > 0) {
            // if email already exists
            echo "$email - This email already exists!";
        } else {
            // let's check if the user uploade file or not
            if (isset($_FILES["image"])) {
                // if file if uploaded
                $img_name = $_FILES["image"]["name"]; // getting user uploaded img name
                $img_type = $_FILES["image"]["type"]; // getting user uploaded img type
                $tmp_name = $_FILES["image"]["tmp_name"]; //this temporary name is used to save/move file to the upload folder

                // let's explode image on '.' and get the last extension like jpg/png
                // Note - explode() function splits string on given parameter like empty string => '' or dot => '.'
                $img_explode = explode(".", $img_name);
                $img_ext = end($img_explode); // here we get the extension of the image file.

                $extension = ["png", "jpeg", "jpg"];
                if (in_array($img_ext, $extension)) {
                    $time = time(); // this will return the current time
                    // we need this beacause when the user uploads an img, the file is stored in the destination folder after its renamed with the current timestamp
                    // so all the image files will have unique

                    // let's move the user uploaded file to a particular folder
                    $new_img_name = $time . "_" . $img_name;
                    if (move_uploaded_file($tmp_name,"../img/uploads/" . $new_img_name)) {
                        // if user uploaded img is moved to folder succcessfully
                        $status = "Active now"; //once user signed up then his status will become active now
                        $random_id = rand(time(), 10000000); // creating random id for user

                        // let's insert all the data inside the database table `users`
                        $sql2 = mysqli_query($conn, "INSERT INTO users(unique_id, fname, lname, email, password, img, status) 
                                                     VALUES
                                                    ('{$random_id}','{$fname}', '{$lname}', '{$email}' ,'{$password}', '{$new_img_name}', '{$status}');"
                                            );

                        if ($sql2) {
                            // if this data is inserted sccessfully
                            $sql3 = mysqli_query($conn, "SELECT * FROM users WHERE email  = '{$email}'");
                            if (mysqli_num_rows($sql3) > 0) {
                                $row = mysqli_fetch_assoc($sql3);
                                $_SESSION["unique_id"] = $row["unique_id"]; // using this session we use users uique id in other php files
                                echo "success";
                            }
                        } else {
                            echo "Something went wrong";
                        }
                    }
                } else {
                    echo "Please select an image file - png, jpg, jpeg";
                }
            } else {
                echo "Please select an image file!";
            }
        }
    } else {
        echo "$email - This is not an valid email id!";
    }
} else {
    echo "All input fields are required!";
}
