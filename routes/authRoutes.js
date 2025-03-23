const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { isAuth } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Protected routes
router.get("/profile", isAuth, authController.getProfile);

module.exports = router;
