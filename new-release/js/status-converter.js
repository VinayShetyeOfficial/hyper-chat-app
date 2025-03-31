// One-time script to convert all "Active now" statuses to "Online"
async function convertActiveNowToOnline() {
  try {
    const db = window.firebaseDb;
    if (!db) {
      console.log("Firebase not initialized");
      return;
    }

    const { collection, query, where, getDocs, doc, updateDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Get all users with "Active now" status
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("status", "==", "Active now"));
    const querySnapshot = await getDocs(q);

    // Update each user's status to "Online"
    const updatePromises = [];
    querySnapshot.forEach((document) => {
      const userRef = doc(db, "users", document.id);
      updatePromises.push(updateDoc(userRef, { status: "Online" }));
      console.log(
        `Converting user ${document.id} from "Active now" to "Online"`
      );
    });

    await Promise.all(updatePromises);
    console.log(
      `Converted ${updatePromises.length} users from "Active now" to "Online"`
    );
  } catch (error) {
    console.error("Error converting statuses:", error);
  }
}

// Run this once when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Wait for Firebase to initialize
  const checkFirebase = setInterval(() => {
    if (window.firebaseDb) {
      clearInterval(checkFirebase);
      convertActiveNowToOnline();
    }
  }, 300);
});
