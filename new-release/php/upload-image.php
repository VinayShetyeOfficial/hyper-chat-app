<?php
header('Content-Type: application/json');

try {
    if (!isset($_FILES['image'])) {
        throw new Exception("No image file provided");
    }
    
    $img = $_FILES['image'];
    $img_name = $img['name'];
    $img_type = $img['type'];
    $tmp_name = $img['tmp_name'];
    $error = $img['error'];
    
    if ($error !== 0) {
        throw new Exception("Error uploading file: " . $error);
    }
    
    // Get file extension
    $img_explode = explode('.', $img_name);
    $img_ext = strtolower(end($img_explode));
    
    // Allowed extensions
    $extensions = ['png', 'jpg', 'jpeg'];
    
    if (!in_array($img_ext, $extensions)) {
        throw new Exception("Please select a PNG, JPG, or JPEG image");
    }
    
    // Create a unique filename
    $time = time();
    $new_img_name = $time . "_" . $img_name;
    
    // Create upload directory if it doesn't exist
    $upload_dir = "../img/uploads/";
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    // Move the uploaded file
    if (!move_uploaded_file($tmp_name, $upload_dir . $new_img_name)) {
        throw new Exception("Failed to move uploaded file");
    }
    
    // Return success with the image URL
    echo json_encode([
        'success' => true,
        'imageUrl' => "img/uploads/" . $new_img_name
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 