const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Landing page / Home page
router.get("/", (req, res) => {
    res.render("index", {
        title: "Fiks Ferdig - Todo App",
    });
});

// Sign in page
router.get("/sign-in", (req, res) => {
    // Redirect to home if already logged in
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("sign-in", {
        title: "Log In - Fiks Ferdig",
    });
});

// Sign up page
router.get("/sign-up", (req, res) => {
    // Redirect to home if already logged in
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("sign-up", {
        title: "Sign Up - Fiks Ferdig",
    });
});

// Family management page
router.get("/family", isAuthenticated, (req, res) => {
    res.render("family", {
        title: "Family - Fiks Ferdig",
    });
});

// Documentation page (admin only)
router.get("/veiledning", isAuthenticated, isAdmin, (req, res) => {
    res.render("veiledning", {
        title: "Documentation - Fiks Ferdig",
    });
});

// Error page
router.get("/error", (req, res) => {
    res.render("error", {
        title: "Error - Fiks Ferdig",
        message: req.query.message || "An error occurred",
    });
});

module.exports = router;
