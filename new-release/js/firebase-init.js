// Firebase initialization
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Import Firebase modules
    const { initializeApp } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js"
    );
    const { getAuth } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js"
    );
    const { getFirestore } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );
    const { getStorage } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js"
    );

    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyA680lTlCSZlyJltI7Rf_mEQywJqNhrXMo",
      authDomain: "hyperchatapp-d73c6.firebaseapp.com",
      projectId: "hyperchatapp-d73c6",
      storageBucket: "hyperchatapp-d73c6.appspot.com", // Make sure this is correct
      messagingSenderId: "128236799823",
      appId: "1:128236799823:web:8a788805aea85626c9673a",
      measurementId: "G-VS7CYFT99G",
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Make Firebase services available globally
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.firebaseStorage = storage;

    console.log("Firebase initialized successfully");

    // Dispatch event when Firebase is ready
    const event = new Event("firebase-ready");
    document.dispatchEvent(event);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    if (typeof toast !== "undefined") {
      toast.error("Firebase initialization failed: " + error.message);
    }
  }
});
