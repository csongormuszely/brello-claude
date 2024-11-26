window.onload = function () {
  console.log("Window loaded - starting initialization");
  const urlParams = new URLSearchParams(window.location.search);
  const boardId = urlParams.get("id");
  const userEmail = localStorage.getItem("userEmail");

  console.log("Loading board:", boardId, "for user:", userEmail);

  // Get board data
  const data = JSON.parse(localStorage.getItem(userEmail) || "[]");
  console.log("Found data:", data);

  const board = data.find((b) => b.id.toString() === boardId);
  console.log("Found board:", board);

  if (board && board.lists) {
    console.log("Found lists:", board.lists);
    const listsContainer = document.getElementById("listsContainer");

    // Clear container
    listsContainer.innerHTML = "";

    // Add each list
    board.lists.forEach((list) => {
      const listElement = createListElement(list);

      // Add cards if they exist
      if (list.cards && list.cards.length > 0) {
        const cardsContainer = listElement.querySelector(".list-cards");
        list.cards.forEach((card) => {
          cardsContainer.appendChild(createCardElement(card));
        });
      }

      listsContainer.appendChild(listElement);
    });

    // Initialize drag and drop
    initializeListDragAndDrop();
  }
};
