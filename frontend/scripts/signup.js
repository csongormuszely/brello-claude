document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");

  try {
    const response = await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Hide the signup container completely
      document.querySelector(".signup-container").style.display = "none";
      // Show success message
      document.getElementById("successMessage").style.display = "block";
    } else {
      errorMessage.textContent = data.message || "Signup failed";
      errorMessage.style.display = "block";
    }
  } catch (error) {
    console.error("Error:", error);
    errorMessage.textContent = "An error occurred during signup";
    errorMessage.style.display = "block";
  }
});
