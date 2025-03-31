const form = document.querySelector(".signup form"),
  continueBtn = form.querySelector(".button input"),
  errorText = form.querySelector(".error-txt");

let redirectAttempted = false;

form.onsubmit = (e) => {
  e.preventDefault();
  return false;
};

// Helper function to log messages without toast
function showMessage(message, type) {
  console.log(`${type}: ${message}`);
}

// Function to upload profile image
async function uploadProfileImage(file) {
  try {
    await waitForFirebase();

    const { ref, uploadBytes, getDownloadURL } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js"
    );

    const storage = window.firebaseStorage;
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the URL
    const imageUrl = `img/uploads/${fileName}`;
    console.log("Image uploaded successfully:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

continueBtn.onclick = async () => {
  try {
    // Show loading state
    continueBtn.value = "Signing up...";
    continueBtn.disabled = true;
    errorText.style.display = "none"; // Hide error text

    // Get form values
    const fname = form.querySelector('input[name="fname"]').value;
    const lname = form.querySelector('input[name="lname"]').value;
    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;

    // Validate form
    if (!fname || !lname || !email || !password) {
      console.error("All fields are required!");
      continueBtn.value = "Continue to Chat";
      continueBtn.disabled = false;
      return;
    }

    // Get profile image if uploaded
    const imageInput = form.querySelector('input[name="image"]');
    let profileImageURL = "";

    // Check if image was uploaded
    if (imageInput && imageInput.files.length > 0) {
      try {
        profileImageURL = await uploadProfileImage(imageInput.files[0]);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        continueBtn.value = "Continue to Chat";
        continueBtn.disabled = false;
        return; // Stop signup if image upload fails
      }
    } else {
      console.error("Profile image is required!");
      continueBtn.value = "Continue to Chat";
      continueBtn.disabled = false;
      return;
    }

    // Attempt to sign up with Firebase
    const signupResult = await firebaseSignUp(
      email,
      password,
      fname,
      lname,
      profileImageURL
    );

    if (signupResult.success) {
      // After successful signup, redirect to login page
      console.log("Signup successful, redirecting to login page...");
      redirectToLogin();
    } else {
      // Log error message to console only
      console.error("Signup failed:", signupResult.error);
      continueBtn.value = "Continue to Chat";
      continueBtn.disabled = false;
    }
  } catch (error) {
    console.error("Signup error:", error);
    continueBtn.value = "Continue to Chat";
    continueBtn.disabled = false;
  }
};

// Helper function for redirect
function redirectToLogin() {
  if (redirectAttempted) return;
  redirectAttempted = true;

  console.log("Redirecting to login.php now");

  // Force redirect with replace immediately
  window.location.replace("login.php");

  // Fallback with href if replace doesn't work
  setTimeout(() => {
    if (window.location.pathname.indexOf("login.php") === -1) {
      console.log("Forcing redirect with href");
      window.location.href = "login.php";
    }
  }, 500);

  // Final fallback - direct the browser to the URL
  setTimeout(() => {
    if (window.location.pathname.indexOf("login.php") === -1) {
      console.log("Final redirect attempt");
      document.location = "login.php";
    }
  }, 1000);
}

async function createUserInFirestore(uid, userData) {
  try {
    const { doc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Add status field explicitly set to "Offline"
    const userDataWithStatus = {
      ...userData,
      status: "Offline", // Ensure this is set to Offline
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Create the user document in Firestore
    await setDoc(doc(window.firebaseDb, "users", uid), userDataWithStatus);
    return true;
  } catch (error) {
    console.error("Error creating user in Firestore:", error);
    return false;
  }
}
