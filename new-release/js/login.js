const form = document.querySelector(".login form"),
  continueBtn = form.querySelector(".button input"),
  errorText = form.querySelector(".error-txt");

form.onsubmit = (e) => {
  e.preventDefault();
  return false;
};

// Helper function to log messages to console only
function logMessage(message, type) {
  console.log(`${type}: ${message}`);
}

continueBtn.onclick = async () => {
  try {
    // Show loading state
    continueBtn.value = "Logging in...";
    continueBtn.disabled = true;
    errorText.style.display = "none"; // Hide error text

    const email = form.querySelector('input[name="email"]').value;
    const password = form.querySelector('input[name="password"]').value;

    if (!email || !password) {
      logMessage("All fields are required", "error");
      continueBtn.value = "Continue to Chat";
      continueBtn.disabled = false;
      return;
    }

    // Authenticate with Firebase
    logMessage("Authenticating with Firebase...", "info");
    const loginResult = await firebaseLogin(email, password);

    if (loginResult.success) {
      logMessage("Login successful!", "success");

      // After successful login, update the user's status to Online
      const { doc, updateDoc, getDoc, setDoc, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
      );

      const userRef = doc(window.firebaseDb, "users", loginResult.user.uid);
      console.log("Setting status to Online for user:", loginResult.user.uid);

      // First check if the user document exists
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        // Update only the status field, preserving all other user data
        await updateDoc(userRef, {
          status: "Online",
          lastSeen: serverTimestamp(),
        });
        console.log(
          "User status updated to Online for user:",
          loginResult.user.uid
        );
      } else {
        // If user document doesn't exist, create it with profile data
        await setDoc(userRef, {
          status: "Online",
          lastSeen: serverTimestamp(),
          name: {
            fname: loginResult.profile.name.fname,
            lname: loginResult.profile.name.lname,
          },
          email: loginResult.user.email,
          profileImageURL: loginResult.profile.profileImageURL || "",
          createdAt: new Date().toISOString(),
        });
        console.log("Created new user document with profile data");
      }

      // Create session using PHP
      const formData = new FormData();
      formData.append("uid", loginResult.user.uid);
      formData.append("email", loginResult.user.email);
      formData.append("fname", loginResult.profile.name.fname);
      formData.append("lname", loginResult.profile.name.lname);
      formData.append(
        "profileImageURL",
        loginResult.profile.profileImageURL || ""
      );

      // Debug logging
      console.log("Sending session data:", {
        uid: loginResult.user.uid,
        email: loginResult.user.email,
        fname: loginResult.profile.name.fname,
        lname: loginResult.profile.name.lname,
        profileImageURL: loginResult.profile.profileImageURL,
      });

      // Send to PHP to create session
      const response = await fetch("php/firebase-session.php", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Session creation response:", responseText);

      if (responseText.trim() === "success") {
        logMessage("Login successful! Redirecting...", "success");
        // Redirect to users page
        window.location.href = "user.php";
      } else {
        logMessage("Error creating session: " + responseText, "error");
        continueBtn.value = "Continue to Chat";
        continueBtn.disabled = false;
      }
    } else {
      logMessage("Login failed: " + loginResult.error, "error");
      continueBtn.value = "Continue to Chat";
      continueBtn.disabled = false;
    }
  } catch (error) {
    console.error("Login error:", error);
    continueBtn.value = "Continue to Chat";
    continueBtn.disabled = false;
  }
};
