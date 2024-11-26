// Get board details from URL
const urlParams = new URLSearchParams(window.location.search);
const boardTitle = urlParams.get("title");
const boardColor = urlParams.get("color");

// Set board title and color
if (boardTitle) {
  document.getElementById("boardTitle").textContent = boardTitle;
}

if (boardColor) {
  document.body.style.backgroundColor = boardColor;
  document.querySelector(".color-indicator").style.backgroundColor = boardColor;
}

// Profile dropdown functions
function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  dropdown.classList.toggle("active");

  // Display user email
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail) {
    document.getElementById("userEmail").textContent = userEmail;
  }
}

function enableEdit() {
  const titleElement = document.getElementById("boardTitle");
  const inputElement = document.getElementById("titleInput");

  // Show input, hide title
  titleElement.style.display = "none";
  inputElement.style.display = "block";

  // Set input value and focus
  inputElement.value = titleElement.textContent;
  inputElement.focus();

  // Handle saving on enter or blur
  inputElement.onkeydown = function (e) {
    if (e.key === "Enter") {
      saveTitle();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  };

  inputElement.onblur = saveTitle;
}

function saveTitle() {
  const titleElement = document.getElementById("boardTitle");
  const inputElement = document.getElementById("titleInput");
  const newTitle = inputElement.value.trim();

  if (newTitle) {
    // Update title in UI
    titleElement.textContent = newTitle;

    // Update title in localStorage
    const userEmail = localStorage.getItem("userEmail");
    const boardId = new URLSearchParams(window.location.search).get("id");
    const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");

    const board = boards.find((b) => b.id.toString() === boardId);
    if (board) {
      board.title = newTitle;
      localStorage.setItem(userEmail, JSON.stringify(boards));
    }
  }

  // Hide input, show title
  titleElement.style.display = "block";
  inputElement.style.display = "none";
}

function cancelEdit() {
  const titleElement = document.getElementById("boardTitle");
  const inputElement = document.getElementById("titleInput");

  // Hide input, show title without saving
  titleElement.style.display = "block";
  inputElement.style.display = "none";
}

function showShareModal() {
  document.getElementById("shareBoardModal").style.display = "flex";
  document.getElementById("shareEmail").focus();
}

function clearEmailInput() {
  document.getElementById("shareEmail").value = "";
  document.getElementById("shareEmail").focus();
}

async function shareBoard() {
  const email = document.getElementById("shareEmail").value.trim();
  if (!email) {
    alert("Please enter an email address");
    return;
  }

  try {
    // Check if user exists
    const exists = await checkEmail(email);
    if (!exists) {
      alert("This email is not registered with Brello");
      return;
    }

    // Share the board
    const boardId = new URLSearchParams(window.location.search).get("id");
    const response = await fetch("/api/share-board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        boardId: boardId,
        shareWithEmail: email,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      // Close modal and clear input
      document.getElementById("shareBoardModal").style.display = "none";
      document.getElementById("shareEmail").value = "";
      document.getElementById("emailCheckIcon").style.display = "none";
      document.getElementById("emailCrossIcon").style.display = "none";

      alert("Board shared successfully!");
    } else {
      throw new Error(result.message || "Error sharing board");
    }
  } catch (error) {
    console.error("Error sharing board:", error);
    alert("Error sharing board");
  }
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("shareBoardModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Close on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    document.getElementById("shareBoardModal").style.display = "none";
  }
});

function closeShareModal() {
  const modal = document.getElementById("shareBoardModal");
  const emailInput = document.getElementById("shareEmail");
  const checkIcon = document.getElementById("emailCheckIcon");
  const crossIcon = document.getElementById("emailCrossIcon");

  // Clear input and hide icons
  emailInput.value = "";
  checkIcon.style.display = "none";
  crossIcon.style.display = "none";

  // Hide modal
  modal.style.display = "none";
}

// Add this function to initialize the board
function initializeBoard() {
  console.log("=== Starting board initialization ===");

  // Get initial parameters
  const urlParams = new URLSearchParams(window.location.search);
  const boardId = urlParams.get("id");
  const userEmail = localStorage.getItem("userEmail");
  console.log("Initial parameters:", { boardId, userEmail });

  // Get and parse data
  const rawData = localStorage.getItem(userEmail);
  console.log("Raw data from localStorage:", rawData);

  if (!rawData) {
    console.error("No data found in localStorage");
    return;
  }

  // Parse the data
  try {
    // Log each step
    console.log("About to parse data");
    const boards = JSON.parse(rawData);
    console.log("Parsed boards:", boards);

    console.log("Looking for board with ID:", boardId);
    const board = boards.find((b) => b.id.toString() === boardId);
    console.log("Found board:", board);

    if (!board) {
      console.error("Board not found in data");
      return;
    }

    // Set up basic board info
    console.log("Setting up board info");
    document.getElementById("boardTitle").textContent = board.title;
    document.body.style.backgroundColor = board.color;
    document.querySelector(".color-indicator").style.backgroundColor =
      board.color;

    // Set up lists container
    console.log("Setting up lists container");
    let listsContainer = document.getElementById("listsContainer");
    console.log("Found lists container:", listsContainer);

    // Ensure container exists
    if (!listsContainer) {
      console.log("Creating new lists container");
      listsContainer = document.createElement("div");
      listsContainer.id = "listsContainer";
      const boardContent = document.querySelector(".board-content");
      const addListButton = document.querySelector(".add-list-btn");
      boardContent.insertBefore(listsContainer, addListButton);
    }

    // Clear and add lists
    console.log("Clearing container");
    listsContainer.innerHTML = "";

    if (board.lists && board.lists.length > 0) {
      console.log(`Found ${board.lists.length} lists to add`);

      board.lists.forEach((list, index) => {
        console.log(`Adding list ${index + 1}:`, list);

        // Create and add list element
        const listElement = createListElement(list);

        // Add cards if they exist
        if (list.cards && list.cards.length > 0) {
          const cardsContainer = listElement.querySelector(".list-cards");
          list.cards.forEach((card) => {
            cardsContainer.appendChild(createCardElement(card));
          });
        }

        listsContainer.appendChild(listElement);
        console.log(`List ${index + 1} added`);
      });
    } else {
      console.log("No lists found on board");
    }

    // Initialize drag and drop
    console.log("Initializing drag and drop");
    initializeListDragAndDrop();

    console.log("=== Initialization complete ===");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

// Make sure function is called when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded - calling initializeBoard");
  initializeBoard();
});

// Also call it directly in case DOMContentLoaded already fired
if (document.readyState === "complete") {
  console.log("Document already loaded - calling initializeBoard");
  initializeBoard();
}

function deleteBoard() {
  // Confirm before deleting
  if (
    confirm(
      "Are you sure you want to delete this board? This action cannot be undone."
    )
  ) {
    const userEmail = localStorage.getItem("userEmail");
    const boardId = new URLSearchParams(window.location.search).get("id");

    // Get current boards
    let boards = JSON.parse(localStorage.getItem(userEmail) || "[]");

    // Filter out the current board
    boards = boards.filter((board) => board.id.toString() !== boardId);

    // Save updated boards list
    localStorage.setItem(userEmail, JSON.stringify(boards));

    // Redirect to boards page
    window.location.href = "/boards.html";
  }
}

function showAddListForm() {
  document.getElementById("addListForm").style.display = "block";
  document.querySelector(".add-list-btn").style.display = "none";
  document.getElementById("listNameInput").focus();
}

function cancelAddList() {
  document.getElementById("addListForm").style.display = "none";
  document.querySelector(".add-list-btn").style.display = "flex";
  document.getElementById("listNameInput").value = "";
}

function saveList() {
  const listName = document.getElementById("listNameInput").value.trim();
  if (listName) {
    console.log("Creating new list:", listName);

    // Create new list
    const list = {
      id: Date.now(),
      name: listName,
      cards: [],
    };

    // Add list to UI
    const listElement = createListElement(list);
    const listsContainer = document.getElementById("listsContainer");
    listsContainer.appendChild(listElement);

    // Save to localStorage
    const userEmail = localStorage.getItem("userEmail");
    const boardId = new URLSearchParams(window.location.search).get("id");
    console.log(
      "Current storage before save:",
      JSON.parse(localStorage.getItem(userEmail))
    );

    const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
    const board = boards.find((b) => b.id.toString() === boardId);

    if (board) {
      if (!board.lists) board.lists = [];
      board.lists.push(list);
      localStorage.setItem(userEmail, JSON.stringify(boards));
      console.log(
        "Updated storage after save:",
        JSON.parse(localStorage.getItem(userEmail))
      );
    }

    // Reset form
    document.getElementById("listNameInput").value = "";
    document.getElementById("addListForm").style.display = "none";
    document.querySelector(".add-list-btn").style.display = "flex";

    // Initialize drag and drop for new list
    initializeListDragAndDrop();
  }
}

function createListElement(list) {
  const listDiv = document.createElement("div");
  listDiv.className = "list";
  listDiv.dataset.listId = list.id;
  listDiv.innerHTML = `
                <div class="list-header">
                    <h3 class="list-title" onclick="enableListEdit(${list.id})">${list.name}</h3>
                    <input type="text" class="list-title-input" style="display: none;">
                    <div class="list-tools">
                        <button class="tool-button" onclick="enableListEdit(${list.id})">✎</button>
                        <button class="tool-button" onclick="deleteList(${list.id})">×</button>
                    </div>
                </div>
                <div class="list-cards">
                    <!-- Cards will be added here -->
                </div>
                <div class="add-card-form" style="display: none;">
                    <input type="text" class="card-input" placeholder="Enter card title">
                    <div class="form-buttons">
                        <button class="cancel-btn" onclick="cancelAddCard(${list.id})">Cancel</button>
                        <button class="add-btn" onclick="saveCard(${list.id})">Add</button>
                    </div>
                </div>
                <button class="add-card-btn" onclick="showAddCardForm(${list.id})">+ Add Card</button>
            `;
  return listDiv;
}

function deleteList(listId) {
  // Remove from UI
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  if (listElement) {
    listElement.remove();
  }

  // Remove from localStorage
  const userEmail = localStorage.getItem("userEmail");
  const boardId = new URLSearchParams(window.location.search).get("id");
  const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
  const board = boards.find((b) => b.id.toString() === boardId);

  if (board && board.lists) {
    board.lists = board.lists.filter((list) => list.id !== listId);
    localStorage.setItem(userEmail, JSON.stringify(boards));
  }
}

function enableListEdit(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const titleElement = listElement.querySelector(".list-title");
  const inputElement = listElement.querySelector(".list-title-input");

  // Show input, hide title
  titleElement.style.display = "none";
  inputElement.style.display = "block";

  // Set input value and focus
  inputElement.value = titleElement.textContent;
  inputElement.focus();

  // Handle saving
  inputElement.onblur = () => saveListTitle(listId);
  inputElement.onkeydown = (e) => {
    if (e.key === "Enter") {
      saveListTitle(listId);
    }
    if (e.key === "Escape") {
      cancelListEdit(listId);
    }
  };
}

function saveListTitle(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const titleElement = listElement.querySelector(".list-title");
  const inputElement = listElement.querySelector(".list-title-input");
  const newTitle = inputElement.value.trim();

  if (newTitle) {
    // Update UI
    titleElement.textContent = newTitle;

    // Update localStorage
    const userEmail = localStorage.getItem("userEmail");
    const boardId = new URLSearchParams(window.location.search).get("id");
    const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
    const board = boards.find((b) => b.id.toString() === boardId);

    if (board && board.lists) {
      const list = board.lists.find((l) => l.id === listId);
      if (list) {
        list.name = newTitle;
        localStorage.setItem(userEmail, JSON.stringify(boards));
      }
    }
  }

  // Hide input, show title
  titleElement.style.display = "block";
  inputElement.style.display = "none";
}

function cancelListEdit(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const titleElement = listElement.querySelector(".list-title");
  const inputElement = listElement.querySelector(".list-title-input");

  // Hide input, show title
  titleElement.style.display = "block";
  inputElement.style.display = "none";
}

function showAddCardForm(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const addForm = listElement.querySelector(".add-card-form");
  const addButton = listElement.querySelector(".add-card-btn");

  addForm.style.display = "block";
  addButton.style.display = "none";

  // Focus input
  const input = addForm.querySelector(".card-input");
  input.focus();

  // Add keyboard handlers
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      saveCard(listId);
    }
    if (e.key === "Escape") {
      cancelAddCard(listId);
    }
  };
}

function cancelAddCard(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const addForm = listElement.querySelector(".add-card-form");
  const addButton = listElement.querySelector(".add-card-btn");
  const input = addForm.querySelector(".card-input");

  addForm.style.display = "none";
  addButton.style.display = "block";
  input.value = "";
}

function saveCard(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const input = listElement.querySelector(".card-input");
  const cardTitle = input.value.trim();

  if (cardTitle) {
    console.log("Creating new card:", cardTitle, "for list:", listId);

    // Create card object
    const card = {
      id: Date.now(),
      title: cardTitle,
    };

    // Add card to UI
    const cardsContainer = listElement.querySelector(".list-cards");
    cardsContainer.appendChild(createCardElement(card));

    // Save to localStorage
    const userEmail = localStorage.getItem("userEmail");
    const boardId = new URLSearchParams(window.location.search).get("id");
    const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
    const board = boards.find((b) => b.id.toString() === boardId);

    if (board && board.lists) {
      const list = board.lists.find((l) => l.id === listId);
      if (list) {
        if (!list.cards) list.cards = [];
        list.cards.push(card);
        localStorage.setItem(userEmail, JSON.stringify(boards));
        console.log("Card saved to localStorage");
      }
    }

    // Reset form
    cancelAddCard(listId);
  }
}

function createCardElement(card) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  cardDiv.dataset.cardId = card.id;
  cardDiv.draggable = true;
  cardDiv.innerHTML = `
                <div class="card-content">
                    <span class="card-title" onclick="enableCardEdit(${card.id})" contenteditable="false">${card.title}</span>
                    <div class="card-tools">
                        <button class="tool-button" onclick="enableCardEdit(${card.id})">✎</button>
                        <button class="tool-button" onclick="deleteCard(${card.id})">×</button>
                    </div>
                </div>
            `;

  // Add drag event listeners
  cardDiv.addEventListener("dragstart", handleDragStart);
  cardDiv.addEventListener("dragend", handleDragEnd);
  return cardDiv;
}

function deleteCard(cardId) {
  // Find and remove card from UI
  const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
  const listElement = cardElement.closest(".list");
  const listId = parseInt(listElement.dataset.listId);

  cardElement.remove();

  // Remove from localStorage
  const userEmail = localStorage.getItem("userEmail");
  const boardId = new URLSearchParams(window.location.search).get("id");
  const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
  const board = boards.find((b) => b.id.toString() === boardId);

  if (board && board.lists) {
    const list = board.lists.find((l) => l.id === listId);
    if (list && list.cards) {
      list.cards = list.cards.filter((card) => card.id !== cardId);
      localStorage.setItem(userEmail, JSON.stringify(boards));
    }
  }
}

function enableCardEdit(cardId) {
  const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
  const titleElement = cardElement.querySelector(".card-title");

  titleElement.contentEditable = "true";
  titleElement.focus();

  // Save the original text in case we need to cancel
  titleElement.dataset.originalText = titleElement.textContent;

  // Handle saving and canceling
  titleElement.onblur = () => saveCardTitle(cardId);
  titleElement.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCardTitle(cardId);
    }
    if (e.key === "Escape") {
      cancelCardEdit(cardId);
    }
  };
}

function saveCardTitle(cardId) {
  const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
  const titleElement = cardElement.querySelector(".card-title");
  const newTitle = titleElement.textContent.trim();

  if (newTitle) {
    // Update localStorage
    const listElement = cardElement.closest(".list");
    const listId = parseInt(listElement.dataset.listId);
    const userEmail = localStorage.getItem("userEmail");
    const boardId = new URLSearchParams(window.location.search).get("id");
    const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
    const board = boards.find((b) => b.id.toString() === boardId);

    if (board && board.lists) {
      const list = board.lists.find((l) => l.id === listId);
      if (list && list.cards) {
        const card = list.cards.find((c) => c.id === cardId);
        if (card) {
          card.title = newTitle;
          localStorage.setItem(userEmail, JSON.stringify(boards));
        }
      }
    }
  } else {
    titleElement.textContent = titleElement.dataset.originalText;
  }

  // Disable editing
  titleElement.contentEditable = "false";
}

function cancelCardEdit(cardId) {
  const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
  const titleElement = cardElement.querySelector(".card-title");

  // Restore original text
  titleElement.textContent = titleElement.dataset.originalText;

  // Disable editing
  titleElement.contentEditable = "false";
}

function handleDragStart(e) {
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", e.target.dataset.cardId);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
}

// Add these functions to initialize drag and drop in lists
function initializeListDragAndDrop() {
  const lists = document.querySelectorAll(".list-cards");
  lists.forEach((list) => {
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  const listCards = e.currentTarget;
  const draggingCard = document.querySelector(".dragging");
  const cardAfterDrag = getCardAfterDragPosition(listCards, e.clientY);

  if (cardAfterDrag) {
    listCards.insertBefore(draggingCard, cardAfterDrag);
  } else {
    listCards.appendChild(draggingCard);
  }
}

function getCardAfterDragPosition(list, y) {
  const cards = [...list.querySelectorAll(".card:not(.dragging)")];

  return cards.reduce(
    (closest, card) => {
      const box = card.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: card };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function handleDrop(e) {
  e.preventDefault();
  const cardId = parseInt(e.dataTransfer.getData("text/plain"));
  const card = document.querySelector(`[data-card-id="${cardId}"]`);
  const newList = e.currentTarget.closest(".list");
  const newListId = parseInt(newList.dataset.listId);

  // Update localStorage
  const userEmail = localStorage.getItem("userEmail");
  const boardId = new URLSearchParams(window.location.search).get("id");
  const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");
  const board = boards.find((b) => b.id.toString() === boardId);

  if (board && board.lists) {
    // Find the card in old list and remove it
    let cardData;
    board.lists.forEach((list) => {
      const cardIndex = list.cards?.findIndex((c) => c.id === cardId);
      if (cardIndex > -1) {
        cardData = list.cards.splice(cardIndex, 1)[0];
      }
    });

    // Add card to new list
    const newListObj = board.lists.find((l) => l.id === newListId);
    if (newListObj && cardData) {
      if (!newListObj.cards) newListObj.cards = [];

      // Find position in new list
      const cards = [...e.currentTarget.querySelectorAll(".card")];
      const cardIndex = cards.indexOf(card);
      newListObj.cards.splice(cardIndex, 0, cardData);

      localStorage.setItem(userEmail, JSON.stringify(boards));
    }
  }
}

// Add this to your initializeBoard function
function initializeBoard() {
  // ... existing initialization code ...

  // Initialize drag and drop after loading lists
  initializeListDragAndDrop();
}

async function checkEmail(email) {
  try {
    const response = await fetch(`/api/check-email/${email}`);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}

// Update the email input event listener
document
  .getElementById("shareEmail")
  .addEventListener("input", async function (e) {
    const email = e.target.value.trim();
    const checkIcon = document.getElementById("emailCheckIcon");
    const crossIcon = document.getElementById("emailCrossIcon");

    if (email) {
      // Check if email exists
      const exists = await checkEmail(email);
      if (exists) {
        checkIcon.style.display = "block";
        crossIcon.style.display = "none";
      } else {
        checkIcon.style.display = "none";
        crossIcon.style.display = "block";
      }
    } else {
      checkIcon.style.display = "none";
      crossIcon.style.display = "none";
    }
  });

function clearEmailInput() {
  const emailInput = document.getElementById("shareEmail");
  const checkIcon = document.getElementById("emailCheckIcon");
  const crossIcon = document.getElementById("emailCrossIcon");
  emailInput.value = "";
  checkIcon.style.display = "none";
  crossIcon.style.display = "none";
  emailInput.focus();
}

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

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("profileDropdown");
  const profileIcon = document.querySelector(".profile-icon");

  if (!profileIcon.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.classList.remove("active");
  }
});

function showColorPicker() {
  const modal = document.getElementById("colorPickerModal");
  modal.style.display = "flex";

  // Select current color
  const currentColor = document.body.style.backgroundColor;
  const colorButtons = document.querySelectorAll(".color-option");
  colorButtons.forEach((button) => {
    if (button.dataset.color === currentColor) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });
}

function showColorPicker() {
  const modal = document.getElementById("colorPickerModal");
  const overlay = document.getElementById("modalOverlay");
  modal.style.display = "block";
  overlay.style.display = "block";

  // Select current color
  const currentColor = document.body.style.backgroundColor;
  const colorButtons = document.querySelectorAll(".color-option");
  colorButtons.forEach((button) => {
    if (button.dataset.color === currentColor) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });
}

function closeColorPicker() {
  const modal = document.getElementById("colorPickerModal");
  const overlay = document.getElementById("modalOverlay");
  modal.style.display = "none";
  overlay.style.display = "none";
}

function changeColor(button) {
  const newColor = button.dataset.color;

  // Update board color in UI
  document.body.style.backgroundColor = newColor;

  // Update color indicator
  document.querySelector(".color-indicator").style.backgroundColor = newColor;

  // Update selected state
  document.querySelectorAll(".color-option").forEach((btn) => {
    btn.classList.remove("selected");
  });
  button.classList.add("selected");

  // Update board color in localStorage
  const userEmail = localStorage.getItem("userEmail");
  const boardId = new URLSearchParams(window.location.search).get("id");
  const boards = JSON.parse(localStorage.getItem(userEmail) || "[]");

  const board = boards.find((b) => b.id.toString() === boardId);
  if (board) {
    board.color = newColor;
    localStorage.setItem(userEmail, JSON.stringify(boards));
  }

  // Close modal
  closeColorPicker();
}

// Close modal when clicking outside
document.getElementById("modalOverlay").addEventListener("click", function () {
  closeColorPicker();
});

// Prevent clicks on the modal from closing it
document
  .getElementById("colorPickerModal")
  .addEventListener("click", function (event) {
    event.stopPropagation();
  });

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("colorPickerModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Check authentication
function checkAuth() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (!isLoggedIn) {
    window.location.href = "/login.html";
  }
}

// Check authentication when page loads
checkAuth();
