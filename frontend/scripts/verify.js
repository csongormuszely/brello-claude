// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (token) {
  verifyEmail(token);
} else {
  document.getElementById("message").textContent = "Invalid verification link";
}

async function verifyEmail(token) {
  try {
    const response = await fetch("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("message").textContent =
        "Email verified successfully! You can now log in to your account.";
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
    } else {
      document.getElementById("message").textContent = data.message;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("message").textContent =
      "An error occurred during verification. Please try again.";
  }
}
