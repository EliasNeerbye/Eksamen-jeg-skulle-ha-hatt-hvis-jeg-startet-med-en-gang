const User = require("../models/User");
const argon2 = require("argon2");
const validator = require("validator");
const { createAuthToken } = require("../utils/authUtils");

/**
 * Register a new user
 */
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username and password are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long",
            });
        }

        if (!validator.isAlphanumeric(username)) {
            return res.status(400).json({
                message: "Username must contain only letters and numbers",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "Username is already taken" });
        }

        // Hash password
        const hashedPassword = await argon2.hash(password);

        // Create new user
        const user = new User({
            username,
            password: hashedPassword,
        });

        await user.save();

        // Create session
        req.session.userId = user._id;
        req.session.isAdmin = user.isAdmin;

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                family: user.family,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res
            .status(500)
            .json({ message: "Server error during registration" });
    }
};

/**
 * Login an existing user
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "Username and password are required" });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create session
        req.session.userId = user._id;
        req.session.isAdmin = user.isAdmin;

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                family: user.family,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error during login" });
    }
};

/**
 * Logout the current user
 */
exports.logout = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: "Failed to logout" });
            }
            res.clearCookie("connect.sid");
            return res.status(200).json({ message: "Logout successful" });
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Server error during logout" });
    }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("-password")
            .populate("family");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                family: user.family,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        return res
            .status(500)
            .json({ message: "Server error retrieving profile" });
    }
};
