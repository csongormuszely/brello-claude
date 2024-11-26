document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get("verified");

  if (verified === "true") {
    alert("Email verified successfully! You can now log in.");
  } else if (verified === "false") {
    alert("Email verification failed. Please try signing up again.");
  }
});

// Debug helper
function showLocalStorage(message) {
  console.log("==== LocalStorage Contents (" + message + ") ====");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`${key}:`, localStorage.getItem(key));
  }
  console.log("==========================================");
}

// Show localStorage contents when page loads
showLocalStorage("login page load");

// First, clear any existing login state when the page loads
console.log("Login page loaded");
localStorage.clear();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");

  console.log("1. Login attempt for:", email);

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("2. Server response:", data);

    if (response.ok) {
      console.log("3. Login successful");

      // Store login state
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", email);

      // Check sessionStorage for saved boards
      const backupKey = "savedBoards_" + email;
      const savedBoards = sessionStorage.getItem(backupKey);
      console.log("Found saved boards in sessionStorage:", savedBoards);

      if (savedBoards) {
        console.log("Restoring boards for:", email);
        localStorage.setItem(email, savedBoards);
        sessionStorage.removeItem(backupKey);
      }

      window.location.href = "boards.html";
    } else {
      errorMessage.textContent = data.message || "Invalid login credentials";
      errorMessage.style.display = "block";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMessage.textContent = "An error occurred during login";
    errorMessage.style.display = "block";
  }
});

// Test localStorage immediately when page loads
try {
  localStorage.setItem("testKey", "testValue");
  console.log("localStorage test:", localStorage.getItem("testKey"));
  localStorage.removeItem("testKey");
  console.log("localStorage is working");
} catch (e) {
  console.error("localStorage test failed:", e);
}
