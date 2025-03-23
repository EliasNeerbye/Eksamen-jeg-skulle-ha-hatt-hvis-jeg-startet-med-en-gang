// Auth related functionality
document.addEventListener("DOMContentLoaded", function () {
    // Handle login form submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;
            const feedbackElement = document.getElementById("feedback");

            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Successful login
                    feedbackElement.textContent =
                        "Logged in successfully! Redirecting...";
                    feedbackElement.className = "feedback success";

                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 1000);
                } else {
                    // Login failed
                    feedbackElement.textContent =
                        data.message ||
                        "Login failed. Please check your credentials.";
                    feedbackElement.className = "feedback error";
                }
            } catch (error) {
                feedbackElement.textContent =
                    "An error occurred. Please try again later.";
                feedbackElement.className = "feedback error";
                console.error("Login error:", error);
            }
        });
    }

    // Handle signup form submission
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword =
                document.getElementById("confirm-password").value;
            const feedbackElement = document.getElementById("feedback");

            // Validate password match
            if (password !== confirmPassword) {
                feedbackElement.textContent = "Passwords do not match.";
                feedbackElement.className = "feedback error";
                return;
            }

            try {
                const response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Successful signup
                    feedbackElement.textContent =
                        "Account created successfully! Redirecting...";
                    feedbackElement.className = "feedback success";

                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        window.location.href = "/";
                    }, 1000);
                } else {
                    // Signup failed
                    feedbackElement.textContent =
                        data.message || "Signup failed. Please try again.";
                    feedbackElement.className = "feedback error";
                }
            } catch (error) {
                feedbackElement.textContent =
                    "An error occurred. Please try again later.";
                feedbackElement.className = "feedback error";
                console.error("Signup error:", error);
            }
        });
    }

    // Handle logout
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function (e) {
            e.preventDefault();

            try {
                const response = await fetch("/api/auth/logout", {
                    method: "GET",
                });

                if (response.ok) {
                    // Redirect to home page after logout
                    window.location.href = "/";
                } else {
                    console.error("Logout failed");
                }
            } catch (error) {
                console.error("Logout error:", error);
            }
        });
    }
});
