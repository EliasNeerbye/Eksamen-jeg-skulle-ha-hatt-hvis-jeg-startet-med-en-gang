const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo");
const User = require("../models/User");
const { isAuthenticated } = require("../middleware/auth");

// Sign in page
router.get("/sign-in", (req, res) => {
    // Redirect if already authenticated
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("signin", {
        title: "Sign In",
        isAuthenticated: false,
    });
});

// Sign up page
router.get("/sign-up", (req, res) => {
    // Redirect if already authenticated
    if (req.session.userId) {
        return res.redirect("/");
    }

    res.render("signup", {
        title: "Sign Up",
        isAuthenticated: false,
    });
});

// Veiledning (guidance) page - only for authenticated users
router.get("/veiledning", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        // Simple admin check (in a real app, you'd have proper roles)
        const isAdmin = user && user.username === "admin";

        if (!isAdmin) {
            return res.status(403).render("error", {
                title: "Feil",
                message: "Unauthorized",
                isAuthenticated: !!req.session.userId,
            });
        }

        res.render("veiledning", {
            title: "Veiledning",
            isAuthenticated: true,
            isAdmin,
        });
    } catch (error) {
        res.status(500).render("error", {
            title: "Feil",
            message: "Server error",
            error,
            isAuthenticated: !!req.session.userId,
        });
    }
});

// Add todo form
router.get("/add-todo", isAuthenticated, (req, res) => {
    res.render("addTodo", {
        title: "Add Todo",
        isAuthenticated: true,
    });
});

// Home page
router.get("/", async (req, res) => {
    try {
        let todos = [];
        if (req.session.userId) {
            // Get today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get today's todos
            todos = await Todo.find({
                owner: req.session.userId,
                dueDate: { $gte: today, $lt: tomorrow },
            }).sort({ dueDate: 1 });
        }

        res.render("index", {
            title: "Fiks Ferdig",
            todos,
            isAuthenticated: !!req.session.userId,
        });
    } catch (error) {
        res.status(500).render("error", {
            title: "Feil",
            message: "Server error",
            error,
            isAuthenticated: !!req.session.userId,
        });
    }
});

// User's todo list - this must come after other specific routes
router.get("/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            return res.status(404).render("error", {
                title: "Feil",
                message: "User not found",
                isAuthenticated: !!req.session.userId,
            });
        }

        // Check if the logged-in user is viewing their own list
        const isOwner =
            req.session.userId &&
            req.session.userId.toString() === user._id.toString();

        if (!isOwner) {
            return res.status(403).render("error", {
                title: "Feil",
                message: "Unauthorized",
                isAuthenticated: !!req.session.userId,
            });
        }

        // Get all todos for the user
        const todos = await Todo.find({ owner: user._id }).sort({ dueDate: 1 });

        // Group todos by date
        const todosByDate = {};

        todos.forEach((todo) => {
            const date = new Date(todo.dueDate).toISOString().split("T")[0];
            if (!todosByDate[date]) {
                todosByDate[date] = [];
            }
            todosByDate[date].push(todo);
        });

        res.render("userTodos", {
            title: `${user.username}'s Todo List`,
            user,
            todos,
            todosByDate,
            isAuthenticated: !!req.session.userId,
            isOwner,
        });
    } catch (error) {
        res.status(500).render("error", {
            title: "Feil",
            message: "Server error",
            error,
            isAuthenticated: !!req.session.userId,
        });
    }
});

module.exports = router;
