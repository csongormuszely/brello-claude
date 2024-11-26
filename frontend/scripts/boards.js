// Debug function to show all localStorage contents
function debugLocalStorage() {
  console.log("==== DEBUG: ALL LOCALSTORAGE CONTENTS ====");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
  }
  console.log("=======================================");
}

// Call this function at key points
document.addEventListener("DOMContentLoaded", debugLocalStorage);

/*function createNewBoard() {
          // To be implemented
          alert('Create new board feature coming soon!');
      }*/

// Check if user is logged in
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (!isLoggedIn) {
    window.location.href = "/login.html";
  }
}

// Check authentication when page loads
checkAuth();

function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.classList.toggle("active");

  // Display user email
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail) {
    document.getElementById("userEmail").textContent = userEmail;
  }
}

// Make sure to store email during login
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userEmail = localStorage.getItem("userEmail");
  if (!isLoggedIn || !userEmail) {
    window.location.href = "/login.html";
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("profileDropdown");
  const profileIcon = document.querySelector(".profile-icon");

  if (!profileIcon.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.classList.remove("active");
  }
});

function signOut() {
  console.log("Starting sign out process");
  const userEmail = localStorage.getItem("userEmail");
  console.log("Current user:", userEmail);

  // Store boards data in sessionStorage
  const boardsData = localStorage.getItem(userEmail);
  if (boardsData) {
    const backupKey = "savedBoards_" + userEmail;
    sessionStorage.setItem(backupKey, boardsData); // Use sessionStorage instead
    console.log("Saved boards in sessionStorage:", boardsData);
  }

  // Clear localStorage
  localStorage.clear();

  window.location.href = "/login.html";
}

let selectedColor = "#4185F4"; // Default color

async function createNewBoard() {
  // Display prompt for board title
  const title = prompt("Enter board title:");
  if (!title) return; // User cancelled or entered empty title

  try {
    const userEmail = localStorage.getItem("userEmail");
    const board = {
      title: title,
      color: "#4185F4", // Default color
      owner: userEmail,
      sharedWith: [],
      lists: [],
    };

    console.log("Sending board data:", board);

    const response = await fetch("/api/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(board),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create board");
    }

    const newBoard = await response.json();
    console.log("Board created:", newBoard);

    // Reload boards
    loadAllBoards();
  } catch (error) {
    console.error("Error creating board:", error);
    alert("Failed to create board: " + error.message);
  }
}

function closeModal() {
  document.getElementById("createBoardModal").style.display = "none";
  document.getElementById("boardTitle").value = "";
  // Reset color selection
  document
    .querySelectorAll(".color-option")
    .forEach((btn) => btn.classList.remove("selected"));
  document.querySelector(".color-option.blue").classList.add("selected");
  selectedColor = "#4185F4";
}

function selectColor(color) {
  selectedColor = color;
  // Update selected state
  document
    .querySelectorAll(".color-option")
    .forEach((btn) => btn.classList.remove("selected"));
  event.target.classList.add("selected");
}

function loadBoards() {
  console.log("Starting loadBoards function");
  showLocalStorage("start of loadBoards");

  const myBoardsGrid = document.getElementById("myBoardsGrid");
  const userEmail = localStorage.getItem("userEmail");
  console.log("Current user email:", userEmail);

  if (!userEmail) {
    console.log("No user email found - redirecting to login");
    window.location.href = "/login.html";
    return;
  }

  // Check for saved boards
  const backupKey = "savedBoards_" + userEmail;
  const savedBoards = localStorage.getItem(backupKey);
  console.log("Checking backup key:", backupKey);
  console.log("Found saved boards:", savedBoards);

  if (savedBoards) {
    console.log("Restoring saved boards");
    localStorage.setItem(userEmail, savedBoards);
    localStorage.removeItem(backupKey);
  }

  // Get current boards
  const userBoards = JSON.parse(localStorage.getItem(userEmail) || "[]");
  console.log("Final boards data:", userBoards);

  // Clear existing boards
  while (myBoardsGrid.children.length > 1) {
    myBoardsGrid.removeChild(myBoardsGrid.firstChild);
  }

  // Add boards
  userBoards.forEach((board) => {
    console.log("Adding board:", board);
    const boardCard = document.createElement("a");
    boardCard.href = `board.html?id=${board.id}&title=${encodeURIComponent(
      board.title
    )}&color=${encodeURIComponent(board.color)}`;
    boardCard.className = "board-card";
    boardCard.style.backgroundColor = board.color;
    boardCard.textContent = board.title;

    myBoardsGrid.insertBefore(
      boardCard,
      document.querySelector(".create-board")
    );
  });

  showLocalStorage("end of loadBoards");
}

// Add this helper function
function showLocalStorage(message) {
  console.log("==== LocalStorage Contents (" + message + ") ====");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}:`, localStorage.getItem(key));
  }
  console.log("==========================================");
}

// Call loadBoards when page loads
document.addEventListener("DOMContentLoaded", loadBoards);

// Make sure loadBoards is called at the right times
document.addEventListener("DOMContentLoaded", loadBoards);

async function saveBoard(boardData) {
  try {
    const response = await fetch("/api/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(boardData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error saving board:", error);
    throw error;
  }
}

async function loadAllBoards() {
  try {
    const userEmail = localStorage.getItem("userEmail");
    console.log("Loading boards for:", userEmail);

    // Load personal boards
    const response = await fetch(`/api/boards/user/${userEmail}`);
    if (!response.ok) {
      throw new Error("Failed to load boards");
    }

    const boards = await response.json();
    console.log("Loaded boards:", boards);

    // Update UI
    const myBoardsGrid = document.getElementById("myBoardsGrid");
    myBoardsGrid.innerHTML = ""; // Clear existing boards

    // Add create board button
    const addButton = document.createElement("button");
    addButton.className = "board-card create-board";
    addButton.onclick = createNewBoard;
    addButton.textContent = "+";
    myBoardsGrid.appendChild(addButton);

    // Add existing boards
    boards.forEach((board) => {
      const boardCard = createBoardCard(board);
      myBoardsGrid.insertBefore(boardCard, addButton);
    });
  } catch (error) {
    console.error("Error loading boards:", error);
    alert("Failed to load boards: " + error.message);
  }
}

// Call when page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded - calling loadAllBoards");
  loadAllBoards();
});

function createBoardCard(board) {
  const boardCard = document.createElement("a");
  boardCard.href = `board.html?id=${board.id}&title=${encodeURIComponent(
    board.title
  )}&color=${encodeURIComponent(board.color)}`;
  boardCard.className = "board-card";
  boardCard.style.backgroundColor = board.color;
  boardCard.textContent = board.title;
  return boardCard;
}

// Call when page loads
document.addEventListener("DOMContentLoaded", loadAllBoards);

async function handleCreateBoard() {
  const title = document.getElementById("boardTitle").value.trim();

  if (!title) {
    alert("Please enter a board name");
    return;
  }

  try {
    const userEmail = localStorage.getItem("userEmail");
    console.log("Before creating board - localStorage contents:");
    debugLocalStorage();

    // Get user's boards
    const userBoards = JSON.parse(localStorage.getItem(userEmail) || "[]");

    // Create new board
    const newBoard = {
      id: Date.now(),
      title: title,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    // Add new board
    userBoards.push(newBoard);

    // Save boards using email as key
    localStorage.setItem(userEmail, JSON.stringify(userBoards));

    console.log("After saving board - localStorage contents:");
    debugLocalStorage();

    closeModal();
    window.location.href = `board.html?id=${
      newBoard.id
    }&title=${encodeURIComponent(title)}&color=${encodeURIComponent(
      selectedColor
    )}`;
  } catch (error) {
    console.error("Error creating board:", error);
    alert("Error creating board. Please try again.");
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("createBoardModal");
  if (event.target === modal) {
    closeModal();
  }
};

// Close modal with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});
