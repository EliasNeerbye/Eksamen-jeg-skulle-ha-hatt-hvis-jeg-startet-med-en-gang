const express = require("express");
const router = express.Router();
const { isAuth } = require("../middleware/authMiddleware");

router.get("/", (req, res) => {
    if (req.session.userId) {
        return res.render("index", {
            user: { id: req.session.userId, isAdmin: req.session.isAdmin },
        });
    } else {
        return res.redirect("/sign-in");
    }
});

router.get("/sign-in", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }
    return res.render("login");
});

router.get("/sign-up", (req, res) => {
    if (req.session.userId) {
        return res.redirect("/");
    }
    return res.render("register");
});

router.get("/veiledning", isAuth, (req, res) => {
    return res.render("guide", {
        user: { id: req.session.userId, isAdmin: req.session.isAdmin },
    });
});

module.exports = router;
