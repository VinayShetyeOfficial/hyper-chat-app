const form = document.querySelector(".typing-area"),
  inputField = form.querySelector(".input-field"),
  sendBtn = form.querySelector("button"),
  chatBox = document.querySelector(".chat-box");

// Add this after your existing const declarations at the top
const chatHeader = document.querySelector(".chat-area header");

// Add the menu HTML to the header
chatHeader.innerHTML += `
  <div class="chat-menu">
    <button class="menu-btn">
      <i class="fas fa-ellipsis-v"></i>
    </button>
    <div class="menu-dropdown">
      <ul>
        <li id="clear-chat-btn">
          Clear Chat
        </li>
      </ul>
    </div>
  </div>
`;

// Add menu toggle functionality
const menuBtn = document.querySelector(".menu-btn");
const menuDropdown = document.querySelector(".menu-dropdown");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("active");
});

// Close menu when clicking outside
document.addEventListener("click", () => {
  menuDropdown.classList.remove("active");
});

// Add this HTML to the page (add right after the wrapper div in chat.php)
const dialogHTML = `
  <div class="custom-dialog-overlay" id="clearChatDialog">
    <div class="custom-dialog">
      <h3>Clear Chat History</h3>
      <p>Are you sure you want to clear all messages? This cannot be undone.</p>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-cancel" id="cancelClearChat">Cancel</button>
        <button class="dialog-btn dialog-btn-confirm" id="confirmClearChat">Clear Chat</button>
      </div>
    </div>
  </div>
`;

// Add dialog to the page
document.body.insertAdjacentHTML("beforeend", dialogHTML);

// Get dialog elements
const dialogOverlay = document.getElementById("clearChatDialog");
const cancelBtn = document.getElementById("cancelClearChat");
const confirmBtn = document.getElementById("confirmClearChat");

// Update the clear chat click handler
document.getElementById("clear-chat-btn").addEventListener("click", (e) => {
  e.preventDefault();
  dialogOverlay.style.display = "flex";
});

// Handle cancel
cancelBtn.addEventListener("click", () => {
  dialogOverlay.style.display = "none";
});

// Handle confirm
confirmBtn.addEventListener("click", async () => {
  dialogOverlay.style.display = "none";
  try {
    const db = window.firebaseDb;
    const { collection, query, where, getDocs, deleteDoc, writeBatch } =
      await import(
        "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
      );

    // Create a batch for bulk operations
    const batch = writeBatch(db);

    // Get all messages between these users
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, where("users", "array-contains", outgoingId));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.users.includes(outgoingId) && data.users.includes(incomingId)) {
        batch.delete(doc.ref);
      }
    });

    // Execute the batch
    await batch.commit();

    // Clear the chat box
    chatBox.innerHTML = `
      <div class="no-messages-container">
        <div class="no-messages">
          <i class="fas fa-comments"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    `;

    // Update cache if it exists
    if (cache.messages) {
      cache.messages[incomingId] = [];
      sessionStorage.setItem("chatCache", JSON.stringify(cache));
    }
  } catch (error) {
    console.error("Error clearing chat:", error);
    alert("Failed to clear chat history");
  }
});

// Close dialog when clicking outside
dialogOverlay.addEventListener("click", (e) => {
  if (e.target === dialogOverlay) {
    dialogOverlay.style.display = "none";
  }
});

// Initialize variables
const outgoingId = form.querySelector("input[name=outgoing_id]").value;
const incomingId = form.querySelector("input[name=incoming_id]").value;
let chatListener = null;
let isTyping = false;
let typingTimeout = null;

// Cache for user details and messages
const cache = {
  userDetails: {},
  messages: {},
  lastAccessed: {},
};

// Prevent form submission
form.onsubmit = (e) => {
  e.preventDefault();
};

// Scroll to bottom of chat
function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Load chat on page load
window.onload = async function () {
  console.log("Chat page loaded for user:", incomingId);

  // Initialize cache
  initializeCache();

  // Wait for Firebase to initialize
  await waitForFirebase();

  // Load user details (with caching)
  await loadUserDetails();

  // Load chat messages (with caching)
  await loadChat();

  // Set up real-time listener for new messages
  setupChatListener();

  // Scroll to bottom of chat
  scrollToBottom();

  // Update last accessed timestamp for this chat
  cache.lastAccessed[incomingId] = Date.now();

  // Store cache in sessionStorage
  sessionStorage.setItem("chatCache", JSON.stringify(cache));
  console.log("Chat cache updated for user:", incomingId);
};

// Initialize cache from sessionStorage if available
function initializeCache() {
  const cachedData = sessionStorage.getItem("chatCache");
  if (cachedData) {
    try {
      const parsedCache = JSON.parse(cachedData);
      // Merge with our cache object
      Object.assign(cache, parsedCache);
      console.log("Chat cache initialized from sessionStorage:", cache);
    } catch (error) {
      console.error("Error parsing cache:", error);
    }
  } else {
    console.log("No chat cache found in sessionStorage");
  }
}

// Call this at the beginning
initializeCache();

// Wait for Firebase to initialize
async function waitForFirebase() {
  if (!window.firebaseDb) {
    await new Promise((resolve) => {
      const checkFirebase = setInterval(() => {
        if (window.firebaseDb) {
          clearInterval(checkFirebase);
          resolve();
        }
      }, 300);
    });
  }
}

// Load user details with caching
async function loadUserDetails() {
  try {
    // Check cache first
    if (cache.userDetails[incomingId]) {
      const userData = cache.userDetails[incomingId];

      // Update UI from cache
      if (userData.profileImageURL) {
        const img = new Image();
        img.onload = function () {
          document.getElementById("chat-user-img").src = this.src;
        };
        img.src = userData.profileImageURL;
      }

      document.getElementById(
        "chat-user-name"
      ).textContent = `${userData.name.fname} ${userData.name.lname}`;

      // Display status (ensure we're using Online/Offline consistently)
      const statusElement = document.getElementById("chat-user-status");
      statusElement.textContent = userData.status || "Offline";

      // Add appropriate class for styling
      if (userData.status === "Online") {
        statusElement.classList.add("online");
        statusElement.classList.remove("offline");
      } else {
        statusElement.classList.add("offline");
        statusElement.classList.remove("online");
      }

      // Update message status to seen
      updateMessageStatus();

      // Fetch fresh data in the background to update cache
      refreshUserDetails();
      return;
    }

    // If not in cache, load from Firestore
    await fetchUserDetails();
  } catch (error) {
    console.error("Error loading user details:", error);
    document.getElementById("chat-user-name").textContent =
      "Error loading user";
  }
}

// Fetch fresh user details and update cache
async function fetchUserDetails() {
  const db = window.firebaseDb;
  const { doc, getDoc, onSnapshot } = await import(
    "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
  );

  // Get user details from Firestore
  const userRef = doc(db, "users", incomingId);

  // Set up real-time listener for user status changes
  const unsubscribe = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data();

      // Cache the user data
      cache.userDetails[incomingId] = userData;

      // Update profile image if available
      if (userData.profileImageURL) {
        const chatUserImg = document.getElementById("chat-user-img");
        if (
          chatUserImg.src !== userData.profileImageURL &&
          userData.profileImageURL !== "img/avatar.png"
        ) {
          chatUserImg.src = userData.profileImageURL;
        }
      }

      // Update the UI with user details
      document.getElementById(
        "chat-user-name"
      ).textContent = `${userData.name.fname} ${userData.name.lname}`;

      // Display status (ensure we're using Online/Offline consistently)
      const statusElement = document.getElementById("chat-user-status");
      statusElement.textContent = userData.status || "Offline";

      // Add appropriate class for styling
      if (userData.status === "Online") {
        statusElement.classList.add("online");
        statusElement.classList.remove("offline");
      } else {
        statusElement.classList.add("offline");
        statusElement.classList.remove("online");
      }

      // Update message status to seen
      updateMessageStatus();
    } else {
      console.error("No such user!");
      document.getElementById("chat-user-name").textContent = "User not found";
    }
  });

  // Store the unsubscribe function to clean up later
  window.userStatusUnsubscribe = unsubscribe;
}

// Refresh user details in the background
function refreshUserDetails() {
  fetchUserDetails().catch((error) => {
    console.error("Error refreshing user details:", error);
  });
}

// Update message status to seen
async function updateMessageStatus() {
  try {
    const db = window.firebaseDb;
    const { collection, query, where, getDocs, updateDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Get messages from this user to current user
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("from", "==", incomingId),
      where("to", "==", outgoingId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);

    // Update each message to read
    querySnapshot.forEach(async (document) => {
      await updateDoc(document.ref, {
        read: true,
      });
    });
  } catch (error) {
    console.error("Error updating message status:", error);
  }
}

// Load chat messages with caching
async function loadChat() {
  try {
    // Check cache first
    if (cache.messages[incomingId] && cache.messages[incomingId].length > 0) {
      console.log("Loading chat from cache for user:", incomingId);
      const messages = cache.messages[incomingId];

      // Render cached messages
      let html = "";
      for (const messageData of messages) {
        const messageClass =
          messageData.from === outgoingId ? "outgoing" : "incoming";

        if (messageClass === "incoming") {
          // For incoming messages, include the user's image
          const userImg =
            document.getElementById("chat-user-img").src || "img/avatar.png";

          html += `
            <div class="chat incoming">
              <img src="${userImg}" alt="">
              <div class="details">
                <p>${messageData.message}</p>
              </div>
            </div>
          `;
        } else {
          html += `<div class="chat ${messageClass}">
                    <div class="details">
                      <p>${messageData.message}</p>
                    </div>
                  </div>`;
        }
      }

      chatBox.innerHTML = html;
      scrollToBottom();

      // Fetch fresh messages in the background
      refreshMessages();
      return;
    }

    console.log(
      "No cache found for user:",
      incomingId,
      "Loading from Firestore"
    );

    // If not in cache, load from Firestore
    const db = window.firebaseDb;

    // Try a simpler query first
    try {
      const { collection, query, where, getDocs } = await import(
        "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
      );

      // Simple query to check if there are any messages between these users
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("users", "array-contains", outgoingId)
      );

      const querySnapshot = await getDocs(q);

      // Filter messages client-side to avoid complex index requirements
      const relevantMessages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.from === outgoingId && data.to === incomingId) ||
          (data.from === incomingId && data.to === outgoingId)
        ) {
          relevantMessages.push({
            id: doc.id,
            ...data,
          });
        }
      });

      // Sort messages by timestamp (if available)
      relevantMessages.sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.seconds : 0;
        const timeB = b.timestamp ? b.timestamp.seconds : 0;
        return timeA - timeB;
      });

      // Store in cache
      cache.messages[incomingId] = relevantMessages;
      sessionStorage.setItem("chatCache", JSON.stringify(cache));

      if (relevantMessages.length === 0) {
        // Show a centered message with an icon
        chatBox.innerHTML = `
          <div class="no-messages-container">
            <div class="no-messages">
              <i class="fas fa-comments"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>`;
        return;
      }

      let html = "";
      for (const messageData of relevantMessages) {
        const messageClass =
          messageData.from === outgoingId ? "outgoing" : "incoming";

        if (messageClass === "incoming") {
          // For incoming messages, include the user's image
          const userImg =
            document.getElementById("chat-user-img").src || "img/avatar.png";

          html += `
            <div class="chat incoming">
              <img src="${userImg}" alt="">
              <div class="details">
                <p>${messageData.message}</p>
              </div>
            </div>
          `;
        } else {
          html += `<div class="chat ${messageClass}">
                    <div class="details">
                      <p>${messageData.message}</p>
                    </div>
                  </div>`;
        }
      }

      chatBox.innerHTML = html;
      scrollToBottom();
    } catch (error) {
      console.error("Error with query:", error);
      // Show a centered message with an icon
      chatBox.innerHTML = `
        <div class="no-messages-container">
          <div class="no-messages">
            <i class="fas fa-comments"></i>
            <p>No messages yet. Start the conversation!</p>
          </div>
        </div>`;
    }
  } catch (error) {
    console.error("Error loading chat:", error);
    // Show a centered message with an icon
    chatBox.innerHTML = `
      <div class="no-messages-container">
        <div class="no-messages">
          <i class="fas fa-comments"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>`;
  }
}

// Refresh messages in the background
function refreshMessages() {
  // Load fresh messages from Firestore
  const db = window.firebaseDb;

  import("https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js")
    .then(async ({ collection, query, where, getDocs }) => {
      try {
        // Simple query to check if there are any messages between these users
        const messagesRef = collection(db, "messages");
        const q = query(
          messagesRef,
          where("users", "array-contains", outgoingId)
        );

        const querySnapshot = await getDocs(q);

        // Filter messages client-side to avoid complex index requirements
        const relevantMessages = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
            (data.from === outgoingId && data.to === incomingId) ||
            (data.from === incomingId && data.to === outgoingId)
          ) {
            relevantMessages.push({
              id: doc.id,
              ...data,
            });
          }
        });

        // Sort messages by timestamp (if available)
        relevantMessages.sort((a, b) => {
          const timeA = a.timestamp ? a.timestamp.seconds : 0;
          const timeB = b.timestamp ? b.timestamp.seconds : 0;
          return timeA - timeB;
        });

        // Update cache
        cache.messages[incomingId] = relevantMessages;
        sessionStorage.setItem("chatCache", JSON.stringify(cache));

        // No need to update UI since we're just refreshing the cache
      } catch (error) {
        console.error("Error refreshing messages:", error);
      }
    })
    .catch((error) => {
      console.error("Error importing Firestore modules:", error);
    });
}

// Set up real-time listener for new messages
function setupChatListener() {
  try {
    const db = window.firebaseDb;

    import("https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js")
      .then(({ collection, query, where, onSnapshot, updateDoc }) => {
        // Simple query to avoid index requirements - no orderBy
        const messagesRef = collection(db, "messages");
        const q = query(
          messagesRef,
          where("users", "array-contains", outgoingId)
        );

        // Set up real-time listener
        chatListener = onSnapshot(q, (snapshot) => {
          // Process messages client-side
          const messages = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Only include messages between these two users
            if (
              (data.from === outgoingId && data.to === incomingId) ||
              (data.from === incomingId && data.to === outgoingId)
            ) {
              messages.push({
                id: doc.id,
                ...data,
              });
            }
          });

          // Update cache
          cache.messages[incomingId] = messages;
          sessionStorage.setItem("chatCache", JSON.stringify(cache));

          // Sort messages by timestamp
          messages.sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeA - timeB;
          });

          // Now render the messages
          renderMessages(messages);
        });
      })
      .catch((error) => {
        console.error("Error setting up chat listener:", error);
      });
  } catch (error) {
    console.error("Error setting up chat listener:", error);
  }
}

// Send message function
sendBtn.onclick = async () => {
  const message = inputField.value.trim();
  if (!message) return;

  try {
    // Clear input field immediately for better UX
    inputField.value = "";

    // Reset the input field height to its default
    inputField.style.height = ""; // Reset to CSS default height

    // Reset typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    isTyping = false;

    const db = window.firebaseDb;
    const { collection, addDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    // Create message object
    const messageData = {
      from: outgoingId,
      to: incomingId,
      message: message,
      timestamp: serverTimestamp(),
      read: false,
      users: [outgoingId, incomingId], // This array helps with querying
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, "messages"), messageData);
    console.log("Message sent with ID:", docRef.id);

    // Add to cache with temporary ID
    if (!cache.messages[incomingId]) {
      cache.messages[incomingId] = [];
    }

    // Create a temporary message object with client-side timestamp
    const tempMessageObj = {
      id: docRef.id,
      ...messageData,
      timestamp: { seconds: Date.now() / 1000 }, // Add a temporary timestamp
    };

    // Add to cache
    cache.messages[incomingId].push(tempMessageObj);

    // Update sessionStorage
    sessionStorage.setItem("chatCache", JSON.stringify(cache));

    // Add the message to the UI immediately
    const newMessageHTML = `
      <div class="chat outgoing">
        <div class="details">
          <p>${message}</p>
        </div>
      </div>
    `;

    // Remove "no messages" container if it exists
    const noMessagesContainer = document.querySelector(
      ".no-messages-container"
    );
    if (noMessagesContainer) {
      chatBox.innerHTML = "";
    }

    // Add the new message to the chat box
    chatBox.insertAdjacentHTML("beforeend", newMessageHTML);

    // Scroll to bottom
    scrollToBottom();
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Error sending message. Please try again.");
  }
};

// Clean up listeners when page is unloaded
window.addEventListener("beforeunload", () => {
  if (chatListener) {
    chatListener();
  }

  if (window.userStatusUnsubscribe) {
    window.userStatusUnsubscribe();
  }
});

// Handle typing indicator and input resizing
inputField.addEventListener("input", function () {
  // Handle typing indicator
  if (!isTyping) {
    isTyping = true;
    // You can add code here to notify the other user that this user is typing
  }

  // Clear any existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // Set a new timeout
  typingTimeout = setTimeout(() => {
    isTyping = false;
    // You can add code here to notify the other user that this user stopped typing
  }, 3000);

  // Prevent excessive height changes by setting min and max height
  const minHeight = 40; // Set a minimum height in pixels
  const maxHeight = 100; // Set a maximum height in pixels

  // Reset height to auto only for measurement
  this.style.height = "auto";

  // Get the scroll height (content height)
  const scrollHeight = this.scrollHeight;

  // Apply constraints
  if (scrollHeight < minHeight) {
    this.style.height = minHeight + "px";
  } else if (scrollHeight > maxHeight) {
    this.style.height = maxHeight + "px";
    this.style.overflowY = "auto"; // Add scrollbar if content exceeds max height
  } else {
    this.style.height = scrollHeight + "px";
    this.style.overflowY = "hidden"; // Hide scrollbar when not needed
  }
});

chatBox.onmouseenter = () => {
  chatBox.classList.add("active");
};

chatBox.onmouseleave = () => {
  chatBox.classList.remove("active");
};

// Function to render messages
function renderMessages(messages) {
  // Clear the chat box if there are messages to render
  if (messages.length > 0) {
    // Remove "no messages" notice if it exists
    const noMessagesContainer = document.querySelector(
      ".no-messages-container"
    );
    if (noMessagesContainer) {
      chatBox.innerHTML = "";
    }

    // Build HTML for all messages
    let messagesHTML = "";

    messages.forEach((message) => {
      const messageClass =
        message.from === outgoingId ? "outgoing" : "incoming";

      if (messageClass === "outgoing") {
        // Outgoing message (sent by current user)
        messagesHTML += `
          <div class="chat outgoing">
            <div class="details">
              <p>${message.message}</p>
            </div>
          </div>
        `;
      } else {
        // Incoming message (from the other user)
        // For incoming messages, use the user's profile image or placeholder
        const userImg =
          document.getElementById("chat-user-img").src || "img/avatar.png";

        messagesHTML += `
          <div class="chat incoming">
            <img src="${userImg}" alt="">
            <div class="details">
              <p>${message.message}</p>
            </div>
          </div>
        `;

        // Mark as read if not already read
        if (!message.read) {
          markMessageAsRead(message.id);
        }
      }
    });

    // Set the HTML content
    chatBox.innerHTML = messagesHTML;

    // Scroll to bottom
    scrollToBottom();
  } else {
    // No messages, show empty state
    chatBox.innerHTML = `
      <div class="no-messages-container">
        <div class="no-messages">
          <i class="fas fa-comments"></i>
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    `;
  }
}

// Function to mark a message as read
async function markMessageAsRead(messageId) {
  try {
    const db = window.firebaseDb;
    const { doc, updateDoc } = await import(
      "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"
    );

    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, { read: true });

    // Also update in cache
    if (cache.messages[incomingId]) {
      const messageIndex = cache.messages[incomingId].findIndex(
        (msg) => msg.id === messageId
      );
      if (messageIndex !== -1) {
        cache.messages[incomingId][messageIndex].read = true;
        sessionStorage.setItem("chatCache", JSON.stringify(cache));
      }
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
}
