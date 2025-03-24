const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/", (req, res) => {
    res.render("index", {
        title: "Fiks Ferdig - Todo App",
    });
});

router.get("/sign-in", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("sign-in", {
        title: "Log In - Fiks Ferdig",
    });
});

router.get("/sign-up", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("sign-up", {
        title: "Sign Up - Fiks Ferdig",
    });
});

router.get("/family", isAuthenticated, (req, res) => {
    res.render("family", {
        title: "Family - Fiks Ferdig",
    });
});

router.get("/veiledning", isAuthenticated, isAdmin, (req, res) => {
    res.render("veiledning", {
        title: "Documentation - Fiks Ferdig",
    });
});

router.get("/error", (req, res) => {
    res.render("error", {
        title: "Error - Fiks Ferdig",
        message: req.query.message || "An error occurred",
    });
});

module.exports = router;
