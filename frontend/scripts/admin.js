async function loadUsers() {
  try {
    const response = await fetch("/api/unverified-users");
    const users = await response.json();

    const userList = document.getElementById("userList");
    userList.innerHTML = users.length === 0 ? "No unverified users found." : "";

    users.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.className = "user-item";
      userDiv.innerHTML = `
              <span>${user.email}</span>
              <button class="delete-btn" onclick="deleteUser('${user.email}')">Delete</button>
          `;
      userList.appendChild(userDiv);
    });
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

async function deleteUser(email) {
  if (confirm(`Are you sure you want to delete ${email}?`)) {
    try {
      await fetch(`/api/delete-user/${email}`, { method: "DELETE" });
      loadUsers(); // Reload the list
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }
}

// Load users when page loads
loadUsers();
