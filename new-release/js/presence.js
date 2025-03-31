// Firebase Presence System
// This script handles user online/offline status reliably

async function setupPresenceSystem() {
  try {
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;

    if (!auth || !db || !auth.currentUser) {
      console.log("Firebase not initialized or user not logged in");
      return;
    }

    const uid = auth.currentUser.uid;
    console.log("Setting up presence system for user:", uid);

    // Import Firestore modules
    const { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } =
      await import(
        "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
      );

    // Reference to the user's document
    const userRef = doc(db, "users", uid);

    // Get current user data
    const userDoc = await getDoc(userRef);

    // Only update status to Online if the user document exists
    // This prevents creating a new document with just the status
    if (userDoc.exists()) {
      // Update status to Online
      await updateDoc(userRef, {
        status: "Online",
        lastSeen: serverTimestamp(),
      });
      console.log("Updated user status to Online");
    } else {
      console.log("User document doesn't exist yet, not updating status");
    }

    // Set up beforeunload event to update status to Offline when user closes the page
    window.addEventListener("beforeunload", async (event) => {
      // This will run when the user closes the tab or navigates away
      try {
        console.log("Page unloading, setting status to Offline for user:", uid);

        // Use navigator.sendBeacon for more reliable delivery during page unload
        const { doc, updateDoc } = await import(
          "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
        );
        await updateDoc(doc(db, "users", uid), {
          status: "Offline",
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating status on unload:", error);
      }
    });

    console.log("Presence system set up successfully for user:", uid);
  } catch (error) {
    console.error("Error setting up presence system:", error);
  }
}

// Run this when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Wait for Firebase to initialize
  const checkFirebase = setInterval(() => {
    if (
      window.firebaseDb &&
      window.firebaseAuth &&
      window.firebaseAuth.currentUser
    ) {
      clearInterval(checkFirebase);
      setupPresenceSystem();
    }
  }, 300);
});
