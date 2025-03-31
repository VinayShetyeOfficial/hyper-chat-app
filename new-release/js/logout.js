// Function to handle logout
async function handleLogout(logoutUrl) {
  try {
    // Update the user's status to "Offline" in Firestore
    if (window.firebaseDb && window.firebaseAuth) {
      const currentUser = window.firebaseAuth.currentUser;

      if (currentUser) {
        const uid = currentUser.uid;
        console.log("Logging out user:", uid);

        const { doc, updateDoc, serverTimestamp } = await import(
          "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
        );

        // Update status to Offline
        await updateDoc(doc(window.firebaseDb, "users", uid), {
          status: "Offline",
          lastSeen: serverTimestamp(),
        });
        console.log("Updated user status to Offline");

        // Sign out from Firebase
        const { signOut } = await import(
          "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"
        );
        await signOut(window.firebaseAuth);
        console.log("Signed out from Firebase");
      }
    }

    // Clean up any listeners
    if (window.userStatusUnsubscribe) {
      window.userStatusUnsubscribe();
    }
    if (window.messageMonitoringUnsubscribe) {
      window.messageMonitoringUnsubscribe();
    }

    // Redirect to logout URL
    window.location.href = logoutUrl;
  } catch (error) {
    console.error("Error during logout:", error);
    // Still redirect even if there's an error
    window.location.href = logoutUrl;
  }
}

// Add a direct logout handler to all logout buttons
document.addEventListener("DOMContentLoaded", () => {
  const logoutButtons = document.querySelectorAll(".logout");

  logoutButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const logoutUrl = button.getAttribute("href") || "logout.php";
      handleLogout(logoutUrl);
    });
  });
});
