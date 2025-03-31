const searchBar = document.querySelector(".users .search input"),
  searchBtn = document.querySelector(".users .search button"),
  searchText = document.querySelector(".users .search .text"),
  searchArea = document.querySelector(".users .search"),
  usersList = document.querySelector(".users .users-list");

// Store the loaded users HTML to avoid reloading
let loadedUsersHTML = "";
let isInitialLoad = true;
let searchTimeout = null; // For debouncing search
let isSearchActive = false; // Track if search is currently being used

// Cache for users data
const usersCache = {
  usersList: "",
  lastUpdated: 0,
  userData: {},
};

// Add this at the top of the file with other variables
let messageListeners = {};

// Initialize cache from sessionStorage
function initializeUsersCache() {
  const cachedData = sessionStorage.getItem("usersCache");
  if (cachedData) {
    try {
      const parsedCache = JSON.parse(cachedData);
      Object.assign(usersCache, parsedCache);

      // If we have cached HTML and it's less than 5 minutes old, use it immediately
      if (
        usersCache.usersList &&
        Date.now() - usersCache.lastUpdated < 5 * 60 * 1000
      ) {
        usersList.innerHTML = usersCache.usersList;
        loadedUsersHTML = usersCache.usersList;
        isInitialLoad = false;

        // Still load fresh data in the background
        setTimeout(() => {
          loadUsers(true); // true = background refresh
        }, 1000);

        return true; // Cache was used
      }
    } catch (error) {
      console.error("Error parsing users cache:", error);
    }
  }
  return false; // Cache was not used
}

// Add loading state
function showLoading() {
  // Only show loading if we don't have cached data
  if (!initializeUsersCache()) {
    usersList.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>
    `;
  }
}

// Initialize with loading state
showLoading();

// Function to activate search
function activateSearch() {
  searchBar.classList.add("active");
  searchBtn.classList.add("active");
  searchText.style.display = "none";
  searchBar.focus();
  isSearchActive = true;
}

// Function to deactivate search
function deactivateSearch() {
  searchBar.classList.remove("active");
  searchBtn.classList.remove("active");
  searchText.style.display = "block";

  // Only reload if search had a value
  if (searchBar.value) {
    searchBar.value = "";
    // Restore the original user list instead of reloading
    usersList.innerHTML = loadedUsersHTML || "No users found";
  }

  isSearchActive = false;
}

// Function to search users with debouncing
const searchUsers = async (searchTerm) => {
  try {
    if (!window.firebaseDb) {
      console.error("Firebase database not initialized.");
      return; // Keep showing loading
    }

    const db = window.firebaseDb;
    const currentUserId = getCurrentUserId(); // Get current user's ID

    const { collection, query, getDocs, where } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Ensure `users` collection is referenced correctly
    const usersRef = collection(db, "users"); // Correct Firestore collection reference
    let querySnapshot;

    // Convert search term to lowercase for case-insensitive comparison
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (searchTerm) {
      // Get all users first
      querySnapshot = await getDocs(query(usersRef));

      // Client-side filtering for more flexible search options
      let filteredDocs = [];

      querySnapshot.forEach((doc) => {
        // Skip if this is the current user
        if (doc.id === currentUserId) {
          return;
        }

        const userData = doc.data();
        // Get name fields and convert to lowercase for comparison
        const fname = (userData.name?.fname || "").toLowerCase();
        const lname = (userData.name?.lname || "").toLowerCase();
        const fullName = `${fname} ${lname}`.toLowerCase();

        // Check if search term is in first name, last name, or full name
        if (
          fname.includes(lowerSearchTerm) ||
          lname.includes(lowerSearchTerm) ||
          fullName.includes(lowerSearchTerm)
        ) {
          filteredDocs.push({ id: doc.id, data: userData });
        }
      });

      // Generate output from filtered docs
      let output = "";

      filteredDocs.forEach((doc) => {
        output += `
          <a href="chat.php?user_id=${doc.id}">
            <div class="content">
              <img src="${
                doc.data.profileImageURL || "img/default.png"
              }" alt="">
              <div class="details">
                <span>${doc.data.name.fname} ${doc.data.name.lname}</span>
                <p>Hey, did you see the game?</p>
              </div>
            </div>
            <div class="status-dot"><i class="fas fa-circle"></i></div>
          </a>
        `;
      });

      // Show content
      usersList.innerHTML =
        output ||
        `
        <div class="no-search-results">
          <i class="fas fa-search"></i>
          <span>No users found</span>
        </div>
      `;
    } else {
      // If no search term, just load all users
      querySnapshot = await getDocs(query(usersRef));

      let output = "";

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        output += `
          <a href="chat.php?user_id=${doc.id}">
            <div class="content">
              <img src="${userData.profileImageURL || "img/avatar.png"}" 
                   alt=""
                   onerror="this.src='img/avatar.png'">
              <div class="details">
                <span>${userData.name.fname} ${userData.name.lname}</span>
                <p>Hey, did you see the game?</p>
              </div>
            </div>
            <div class="status-dot"><i class="fas fa-circle"></i></div>
          </a>
        `;
      });

      // Show content
      usersList.innerHTML = output || "No users found";
    }
  } catch (error) {
    console.error("Error searching users:", error);
    usersList.innerHTML = "No users found";
  }
};

// Function to render a single user in the users list
async function renderUser(userData, userId) {
  try {
    // Skip rendering the current user
    if (userId === getCurrentUserId()) {
      return "";
    }

    // Get the last message between these users
    const lastMessage = await getLastMessage(userId);

    // Determine message style based on status
    let messageStyle = "";
    let messagePrefix = "";

    if (lastMessage) {
      // If there's a message
      if (lastMessage.from === getCurrentUserId()) {
        // Outgoing message (you sent it)
        messagePrefix = "You: ";
        messageStyle = 'style="color: #f03838;"'; // Red for outgoing messages
      } else if (!lastMessage.read) {
        // Incoming unread message
        messageStyle = 'style="color: #3838ff; font-weight: bold;"'; // Bold blue for unread
      } else {
        // Incoming read message
        messageStyle = 'style="color: #666;"'; // Gray for read messages
      }
    }

    // Format the message text
    const messageText = lastMessage
      ? lastMessage.message.length > 28
        ? lastMessage.message.substring(0, 28) + "..."
        : lastMessage.message
      : "No messages yet";

    // Create the HTML for this user
    return `
      <a href="chat.php?user_id=${userId}">
        <div class="content">
          <img src="${userData.profileImageURL || "img/avatar.png"}" alt="">
          <div class="details">
            <span>${userData.name.fname} ${userData.name.lname}</span>
            <p ${messageStyle}>${messagePrefix}${messageText}</p>
          </div>
        </div>
        <div class="status-dot ${
          userData.status === "Online" ? "" : "offline"
        }">
          <i class="fas fa-circle"></i>
        </div>
      </a>
    `;
  } catch (error) {
    console.error("Error rendering user:", error);
    return "";
  }
}

// Function to get the last message between current user and another user
async function getLastMessage(userId) {
  try {
    const db = window.firebaseDb;
    const { collection, query, where, orderBy, limit, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Even simpler query that doesn't require any composite index
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("users", "array-contains", getCurrentUserId())
    );

    const querySnapshot = await getDocs(q);

    // Filter and sort messages client-side
    let relevantMessages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        (data.from === getCurrentUserId() && data.to === userId) ||
        (data.from === userId && data.to === getCurrentUserId())
      ) {
        relevantMessages.push({
          id: doc.id,
          ...data,
        });
      }
    });

    // Sort by timestamp if available
    relevantMessages.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.seconds : 0;
      const timeB = b.timestamp ? b.timestamp.seconds : 0;
      return timeB - timeA; // Descending order (newest first)
    });

    // Return the first message (most recent)
    return relevantMessages.length > 0 ? relevantMessages[0] : null;
  } catch (error) {
    console.error("Error getting last message:", error);
    return null;
  }
}

// Function to set up real-time message listeners
async function setupMessageListeners() {
  try {
    const db = window.firebaseDb;
    const currentUserId = getCurrentUserId();

    if (!db || !currentUserId) {
      console.error("Firebase not initialized or user not logged in");
      return;
    }

    const { collection, query, where, onSnapshot } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Listen for messages where current user is involved
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("users", "array-contains", currentUserId)
    );

    // Unsubscribe from previous listener if exists
    if (messageListeners.messages) {
      messageListeners.messages();
    }

    // Set up new listener
    messageListeners.messages = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            // Refresh the user list when a new message is added or modified
            loadUsers(true); // true means background refresh (no loading indicator)
          }
        });
      },
      (error) => {
        console.error("Error listening for messages:", error);
      }
    );

    console.log("Message listeners set up successfully");
  } catch (error) {
    console.error("Error setting up message listeners:", error);
  }
}

// Function to show "No users found" message consistently
function showNoUsersMessage() {
  return `
    <div class="no-search-results">
      <i class="fas fa-search"></i>
      <span>No users found</span>
    </div>
  `;
}

// Modify the existing loadUsers function to be more efficient
async function loadUsers(backgroundRefresh = false) {
  try {
    if (!backgroundRefresh) {
      // Show only spinner during loading
      usersList.innerHTML = `
        <div class="loading-container">
          <div class="spinner"></div>
        </div>
      `;
    }

    const db = window.firebaseDb;
    const { collection, getDocs, query } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Get all users
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(query(usersRef));

    // Array to store user data with their last message
    const usersWithLastMessage = [];

    // Process each user
    const messagePromises = [];
    const userDataMap = {};

    // First collect all user data
    querySnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;

      // Skip current user
      if (userId === getCurrentUserId()) return;

      userDataMap[userId] = userData;

      // Create a promise for getting the last message
      const messagePromise = getLastMessage(userId).then((lastMessage) => {
        usersWithLastMessage.push({
          userId,
          userData,
          lastMessage,
          timestamp: lastMessage ? lastMessage.timestamp?.seconds || 0 : 0,
        });
      });

      messagePromises.push(messagePromise);
    });

    // Wait for all message promises to resolve
    await Promise.all(messagePromises);

    // Sort users by message timestamp (most recent first)
    usersWithLastMessage.sort((a, b) => b.timestamp - a.timestamp);

    // Generate HTML for each user
    const userHtmlPromises = usersWithLastMessage.map((user) =>
      renderUser(user.userData, user.userId)
    );

    const userHtmlResults = await Promise.all(userHtmlPromises);
    const output = userHtmlResults.join("");

    // Update the UI if there's any change
    if (output) {
      usersList.innerHTML = output;
    } else if (!backgroundRefresh) {
      // Clear any existing content and add the no users message
      usersList.innerHTML = showNoUsersMessage();
    }

    // Store the HTML for later use
    loadedUsersHTML = usersList.innerHTML;

    return true;
  } catch (error) {
    console.error("Error loading users:", error);
    if (!backgroundRefresh) {
      usersList.innerHTML = showNoUsersMessage();
    }
    return false;
  }
}

// Make entire search area clickable to activate search
searchArea.addEventListener("click", (e) => {
  // Only activate if not already active and not clicking on the button
  if (!searchBar.classList.contains("active") && e.target !== searchBtn) {
    activateSearch();
  }
});

// Search button toggle
searchBtn.onclick = (e) => {
  e.preventDefault();
  if (searchBar.classList.contains("active")) {
    deactivateSearch();
  } else {
    activateSearch();
  }
};

// Search functionality with debouncing
searchBar.onkeyup = (e) => {
  // Skip search for navigation keys (arrow keys, home, end, etc.)
  const navigationKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Tab",
    "Escape",
  ];

  // Get the current search term
  let searchTerm = searchBar.value.trim();

  // If it's just cursor movement or modifier keys, don't trigger search
  if (navigationKeys.includes(e.key)) {
    return;
  }

  // Special handling for Backspace
  if (e.key === "Backspace") {
    // If search is already empty or will be empty after this backspace, restore original list
    if (
      searchTerm === "" ||
      (e.target.selectionStart === 1 && e.target.selectionEnd === 1)
    ) {
      usersList.innerHTML = loadedUsersHTML;
      return;
    }
  }

  // Clear any existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // If search is empty, restore original list immediately and don't perform search
  if (searchTerm === "") {
    usersList.innerHTML = loadedUsersHTML;
    return;
  }

  // Set a new timeout (500ms delay)
  searchTimeout = setTimeout(() => {
    // Only show loading and perform search if there's a search term
    if (searchTerm && searchTerm === searchBar.value.trim()) {
      // Show a "Searching..." message instead of the loading spinner
      usersList.innerHTML = `<p style="text-align: center; padding: 20px;">Searching...</p>`;

      // Short delay before showing loading spinner
      setTimeout(() => {
        // Only proceed if the search term hasn't changed
        if (searchTerm === searchBar.value.trim()) {
          // Now show the loading spinner
          showLoading();
          // Perform the search
          searchUsers(searchTerm);
        }
      }, 100);
    }
  }, 500);
};

// Function to update user status in the UI
function updateUserStatusInUI(userId, status) {
  // Find the user element in the list
  const userElement = document.querySelector(
    `.users-list a[href*="user_id=${userId}"]`
  );

  if (userElement) {
    // Update status dot
    const statusDot = userElement.querySelector(".status-dot");
    if (statusDot) {
      if (status === "Online") {
        statusDot.classList.remove("offline");
        console.log(`User ${userId} is now shown as Online in UI`);
      } else {
        statusDot.classList.add("offline");
        console.log(`User ${userId} is now shown as Offline in UI`);
      }
    }
  }
}

// Function to update message preview in user list
function updateMessagePreview(userId, message, isOutgoing, isUnread = false) {
  const userElement = document.querySelector(
    `.users-list a[href*="user_id=${userId}"]`
  );

  if (userElement) {
    const previewElement = userElement.querySelector("p");
    if (previewElement) {
      // Truncate message if too long
      const truncatedMessage =
        message.length > 28 ? message.substring(0, 25) + "..." : message;

      // Add prefix for outgoing messages
      const displayText = isOutgoing
        ? `You: ${truncatedMessage}`
        : truncatedMessage;

      // Update the preview text
      previewElement.textContent = displayText;

      // Set appropriate styling
      if (isOutgoing) {
        // Outgoing message (you sent it)
        previewElement.style.color = "#67676a"; // Gray for outgoing
        previewElement.style.fontWeight = "normal";
      } else if (isUnread) {
        // Incoming unread message
        previewElement.style.color = "#3838ff"; // Blue for unread
        previewElement.style.fontWeight = "bold";
      } else {
        // Incoming read message
        previewElement.style.color = "#666"; // Gray for read
        previewElement.style.fontWeight = "normal";
      }

      console.log(
        `Updated message preview for user ${userId}: "${truncatedMessage}"`
      );

      // Move this conversation to the top of the list
      const usersList = document.querySelector(".users-list");
      if (usersList && userElement.parentNode === usersList) {
        usersList.insertBefore(userElement, usersList.firstChild);
      }
    }
  } else {
    console.log(
      `User element for ${userId} not found, may need to refresh the list`
    );
    // If the user isn't in the list yet, we might need to refresh the entire list
    loadUsers(true);
  }
}

// Function to set up real-time message monitoring
async function setupRealtimeMessageMonitoring() {
  try {
    const db = window.firebaseDb;
    const auth = window.firebaseAuth;

    if (!db || !auth || !auth.currentUser) {
      console.log("Firebase not initialized or user not logged in");
      return;
    }

    const currentUserId = auth.currentUser.uid;
    console.log(
      "Setting up real-time message monitoring for user:",
      currentUserId
    );

    const { collection, query, where, onSnapshot } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Listen for messages where current user is involved - no orderBy to avoid index requirements
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("users", "array-contains", currentUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Message update detected, processing changes...");

      // Process changes
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const message = change.doc.data();
          const messageId = change.doc.id;

          // Determine the conversation partner
          const partnerId =
            message.from === currentUserId ? message.to : message.from;

          console.log(
            `Processing message ${messageId} between ${currentUserId} and ${partnerId}`
          );

          // Update the message preview in the UI
          const isOutgoing = message.from === currentUserId;
          updateMessagePreview(
            partnerId,
            message.message,
            isOutgoing,
            !message.read
          );
        }
      });
    });

    // Store the unsubscribe function
    window.messageMonitoringUnsubscribe = unsubscribe;

    console.log("Real-time message monitoring set up successfully");
  } catch (error) {
    console.error("Error setting up real-time message monitoring:", error);
  }
}

// Enhanced real-time user monitoring system
function setupRealtimeUserMonitoring() {
  if (!window.firebaseDb) {
    console.log(
      "Waiting for Firebase to initialize before setting up monitoring..."
    );

    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
      if (window.firebaseDb) {
        clearInterval(checkFirebase);
        setupRealtimeUserMonitoring();
      }
    }, 300);

    return;
  }

  console.log("Setting up real-time user monitoring...");

  // Import Firestore modules
  import("https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js")
    .then(({ collection, query, onSnapshot, orderBy }) => {
      const db = window.firebaseDb;
      const usersRef = collection(db, "users");

      // Listen for ALL user changes (new users, status changes, etc.)
      const unsubscribe = onSnapshot(
        query(usersRef, orderBy("createdAt", "desc")),
        async (snapshot) => {
          let needsFullRefresh = false;

          // Process each change
          for (const change of snapshot.docChanges()) {
            const userData = change.doc.data();
            const userId = change.doc.id;

            // Skip if it's the current user
            if (userId === getCurrentUserId()) continue;

            if (change.type === "added") {
              // New user added - we'll do a full refresh to properly sort and display
              console.log("New user detected:", userData.name?.fname);
              needsFullRefresh = true;
            } else if (change.type === "modified") {
              // User data changed - update just their status if that's what changed
              console.log("User updated:", userData.name?.fname);

              // Find this user in the list
              const userElement = document.querySelector(
                `a[href*="user_id=${userId}"]`
              );

              if (userElement) {
                // Update status dot
                const statusDot = userElement.querySelector(".status-dot");
                if (statusDot) {
                  if (userData.status === "Online") {
                    statusDot.classList.remove("offline");
                  } else {
                    statusDot.classList.add("offline");
                  }
                }

                // If we need to update other user data, we can do it here
                // For example, updating profile image or name
                const userImg = userElement.querySelector(".content img");
                if (userImg && userData.profileImageURL) {
                  userImg.src = userData.profileImageURL;
                }

                // Update name if needed
                const userName = userElement.querySelector(
                  ".content .details span"
                );
                if (userName && userData.name) {
                  userName.textContent = `${userData.name.fname} ${userData.name.lname}`;
                }
              } else {
                // If we can't find the user element, do a full refresh
                needsFullRefresh = true;
              }

              // Update the user's status in the UI
              updateUserStatusInUI(userId, userData.status);

              // Log the status change
              console.log(
                `User ${userId} status changed to: ${userData.status}`
              );
            } else if (change.type === "removed") {
              // User removed - do a full refresh
              console.log("User removed:", userId);
              needsFullRefresh = true;
            }
          }

          // If we need a full refresh, do it
          if (needsFullRefresh) {
            console.log("Performing full user list refresh");
            await loadUsers(true); // true = background refresh
          }
        },
        (error) => {
          console.error("Error in real-time user monitoring:", error);
        }
      );

      // Store the unsubscribe function
      window.userMonitoringUnsubscribe = unsubscribe;
    })
    .catch((error) => {
      console.error("Error setting up real-time user monitoring:", error);
    });
}

// Call this function when the page loads
window.addEventListener("DOMContentLoaded", () => {
  // Try to get currentUserId from PHP
  if (typeof getCurrentUserId !== "undefined") {
    // Store it in session storage for persistence
    sessionStorage.setItem("currentUserId", getCurrentUserId());
  }

  // Load users with a slight delay
  setTimeout(() => {
    loadUsers().then(() => {
      // Set up real-time monitoring after initial load
      setupRealtimeUserMonitoring();
      setupRealtimeMessageMonitoring();
    });
  }, 300);
});

// Clean up listeners when page is unloaded
window.addEventListener("beforeunload", () => {
  if (window.userMonitoringUnsubscribe) {
    window.userMonitoringUnsubscribe();
  }
  if (window.messageMonitoringUnsubscribe) {
    window.messageMonitoringUnsubscribe();
  }
});

// Close search when clicking outside - but keep the search box visible when results are shown
document.addEventListener("click", (e) => {
  // Only hide the search input when clicking outside AND there's no search term
  if (
    searchBar.classList.contains("active") &&
    !searchArea.contains(e.target) &&
    searchBar.value.trim() === "" // Only hide if search is empty
  ) {
    // Just hide the search input
    searchBar.classList.remove("active");
    searchBtn.classList.remove("active");
    searchText.style.display = "block";
  }
  // If there's a search term, do nothing when clicking outside
});

// Add a clear search button functionality
searchBtn.addEventListener("click", (e) => {
  e.preventDefault();

  // If search is active and has a value, clear it and restore original list
  if (searchBar.classList.contains("active") && searchBar.value.trim() !== "") {
    searchBar.value = "";
    usersList.innerHTML = loadedUsersHTML;
    deactivateSearch();
  } else if (searchBar.classList.contains("active")) {
    // If search is active but empty, just deactivate
    deactivateSearch();
  } else {
    // If search is not active, activate it
    activateSearch();
  }
});

// Add this to the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", async function () {
  // ... existing code ...

  // Set up message listeners for real-time updates
  const checkFirebase = setInterval(() => {
    if (
      window.firebaseAuth &&
      window.firebaseDb &&
      window.firebaseAuth.currentUser
    ) {
      clearInterval(checkFirebase);
      setupMessageListeners();
    }
  }, 300);
});
