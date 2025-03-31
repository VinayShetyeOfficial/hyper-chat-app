// Firebase Authentication Helper Functions

// Wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseAuth) {
      resolve();
    } else {
      document.addEventListener("firebase-ready", () => {
        resolve();
      });
    }
  });
}

// Sign up a new user
async function firebaseSignUp(
  email,
  password,
  fname,
  lname,
  profileImageURL = ""
) {
  try {
    await waitForFirebase();

    const auth = window.firebaseAuth;
    const db = window.firebaseDb;

    console.log("Creating user with email:", email);

    // First check if we have a profile image
    if (!profileImageURL) {
      // If no image URL was provided, we should abort the signup
      console.error("Profile image is required");
      throw new Error("Profile image is required");
    }

    const { createUserWithEmailAndPassword } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"
    );

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("User created:", userCredential.user.uid);

    // Create user profile in Firestore
    const { doc, setDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    const userProfile = {
      email,
      name: { fname, lname },
      createdAt: new Date().toISOString(),
      status: "Offline",
      profileImageURL: profileImageURL,
      lastSeen: serverTimestamp(),
    };

    await setDoc(doc(db, "users", userCredential.user.uid), userProfile);
    console.log("User profile created in Firestore");

    // Sign out the user immediately after creation to ensure they start as Offline
    await auth.signOut();
    console.log("User signed out after account creation");

    return {
      success: true,
      user: userCredential.user,
      profile: userProfile,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: error.message };
  }
}

// Upload profile image to local server and update Firestore
async function uploadProfileImage(file) {
  try {
    console.log("Starting image upload process");

    // First upload to local server
    const formData = new FormData();
    formData.append("image", file);

    console.log("Uploading to local server");
    const uploadResponse = await fetch("php/upload-image.php", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image to server");
    }

    const uploadResult = await uploadResponse.json();
    console.log("Upload result:", uploadResult);

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Image upload failed");
    }

    // Return the local path
    return uploadResult.imageUrl; // This should be something like "img/uploads/12345_filename.jpg"
  } catch (error) {
    console.error("Upload error details:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Login user with Firebase
async function firebaseLogin(email, password) {
  try {
    await waitForFirebase();

    const auth = window.firebaseAuth;
    const { signInWithEmailAndPassword } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"
    );

    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get user's profile from Firestore
    const db = window.firebaseDb;
    const { doc, getDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userDoc.data();
    return {
      success: true,
      user: userCredential.user,
      profile: userData,
    };
  } catch (error) {
    console.error("Login error:", error);

    // Convert Firebase error codes to user-friendly messages
    let errorMessage;
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email format";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many failed attempts. Please try again later";
        break;
      default:
        errorMessage = error.message || "Login failed. Please try again";
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
    };
  }
}

// Logout user
async function firebaseLogout() {
  try {
    // Wait for Firebase to be initialized
    await waitForFirebase();

    const auth = window.firebaseAuth;
    const { signOut } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"
    );

    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add this function to delete user if something fails
async function firebaseDeleteUser(userId) {
  try {
    await waitForFirebase();

    const auth = window.firebaseAuth;
    const db = window.firebaseDb;

    // Delete from Firestore
    const { doc, deleteDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );
    await deleteDoc(doc(db, "users", userId));

    // Delete from Authentication
    const { deleteUser } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"
    );
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

// Add this function to update user profile
async function updateUserProfile(userId, updates) {
  try {
    await waitForFirebase();

    const db = window.firebaseDb;
    const { doc, updateDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    await updateDoc(doc(db, "users", userId), updates);

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
}

// Function to update user status to Online
async function updateUserStatusToActive() {
  try {
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;

    if (!auth || !db || !auth.currentUser) {
      console.log("Firebase not initialized or user not logged in");
      return;
    }

    const { doc, getDoc, updateDoc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    const uid = auth.currentUser.uid;
    console.log("Updating status for user:", uid);

    const userRef = doc(db, "users", uid);

    // First check if the document exists
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(userRef, {
        status: "Online", // Use "Online" consistently
      });
      console.log("User status updated to Online for user:", uid);
    } else {
      // Document doesn't exist, create it with minimal data
      console.warn(
        "User document not found, creating a minimal one for user:",
        uid
      );
      await setDoc(userRef, {
        name: { fname: auth.currentUser.displayName || "User", lname: "" },
        email: auth.currentUser.email || "",
        status: "Online", // Use "Online" consistently
        createdAt: new Date().toISOString(),
      });
      console.log(
        "Created new user document with Online status for user:",
        uid
      );
    }
  } catch (error) {
    console.error("Error updating user status:", error);
  }
}

// Update status when auth state changes
window.addEventListener("DOMContentLoaded", async () => {
  // Wait for Firebase Auth to be initialized
  if (!window.firebaseAuth) {
    await new Promise((resolve) => {
      const checkFirebase = setInterval(() => {
        if (window.firebaseAuth) {
          clearInterval(checkFirebase);
          resolve();
        }
      }, 300);
    });
  }

  // Get current user ID
  const currentUserId = getCurrentUserId();

  if (currentUserId) {
    // Update status to active
    updateUserStatusToActive();

    // Also set up an event listener for when the window is closed/refreshed
    window.addEventListener("beforeunload", async (e) => {
      try {
        const { doc, updateDoc } = await import(
          "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
        );

        // Update the user's status in Firestore
        const userRef = doc(window.firebaseDb, "users", currentUserId);
        await updateDoc(userRef, {
          status: "Offline",
        });
      } catch (error) {
        console.error("Error updating status on page unload:", error);
      }
    });
  }
});

// Check if getCurrentUserId is already defined before declaring it
if (typeof getCurrentUserId !== "function") {
  // Function to get the current user ID
  function getCurrentUserId() {
    const auth = window.firebaseAuth;
    return auth && auth.currentUser ? auth.currentUser.uid : null;
  }
}

// Update the createUserInFirestore function to ensure Offline status
async function createUserInFirestore(uid, userData) {
  try {
    const { doc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Ensure status is Offline
    userData.status = "Offline";

    // Create the user document in Firestore
    await setDoc(doc(window.firebaseDb, "users", uid), userData);
    return true;
  } catch (error) {
    console.error("Error creating user in Firestore:", error);
    return false;
  }
}
