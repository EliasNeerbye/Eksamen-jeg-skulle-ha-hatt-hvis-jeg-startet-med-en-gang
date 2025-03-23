const express = require("express");
const router = express.Router();
const { isAuth } = require("../middleware/authMiddleware");

// Home page - redirect based on auth status
router.get("/", (req, res) => {
    if (req.session.userId) {
        // User is logged in, render todo list
        return res.render("index", {
            user: { id: req.session.userId, isAdmin: req.session.isAdmin },
        });
    } else {
        // User is not logged in, redirect to login page
        return res.redirect("/sign-in");
    }
});

// Login page
router.get("/sign-in", (req, res) => {
    if (req.session.userId) {
        // Already logged in, redirect to home
        return res.redirect("/");
    }
    return res.render("login");
});

// Registration page
router.get("/sign-up", (req, res) => {
    if (req.session.userId) {
        // Already logged in, redirect to home
        return res.redirect("/");
    }
    return res.render("register");
});

// Veiledning page - only accessible to authenticated users
router.get("/veiledning", isAuth, (req, res) => {
    return res.render("guide", {
        user: { id: req.session.userId, isAdmin: req.session.isAdmin },
    });
});

module.exports = router;
