const Todo = require("../models/Todo");
const User = require("../models/User");
const Family = require("../models/Family");
const { hasResourcePermission } = require("../utils/authUtils");

/**
 * Create a new todo
 */
exports.createTodo = async (req, res) => {
    try {
        const {
            title,
            description,
            day,
            repeats,
            repeatPattern,
            familyAccess,
            accessLevel,
        } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({ message: "Todo title is required" });
        }

        // Validate day
        if (day && (day < 1 || day > 7)) {
            return res
                .status(400)
                .json({ message: "Day must be between 1 and 7" });
        }

        // Create new todo
        const todo = new Todo({
            title,
            description,
            day,
            repeats: repeats || false,
            repeatPattern: repeatPattern || "none",
            owner: req.userId,
            familyAccess: familyAccess || false,
            accessLevel: accessLevel || "private",
        });

        await todo.save();

        return res.status(201).json({
            message: "Todo created successfully",
            todo,
        });
    } catch (error) {
        console.error("Create todo error:", error);
        return res.status(500).json({ message: "Server error creating todo" });
    }
};

/**
 * Get all todos for current user
 */
exports.getAllTodos = async (req, res) => {
    try {
        const { day } = req.query;

        // Base query - get user's own todos
        let query = { owner: req.userId };

        // Filter by day if specified
        if (day) {
            query.day = parseInt(day);
        }

        const todos = await Todo.find(query);

        // If user has a family, get family todos they have access to
        const user = await User.findById(req.userId);
        if (user.family) {
            const family = await Family.findById(user.family);

            // Get family members' todos marked for family access
            const familyTodos = await Todo.find({
                owner: { $in: family.members },
                owner: { $ne: req.userId }, // Exclude own todos
                familyAccess: true,
            });

            // Filter by access level
            const accessibleTodos = familyTodos.filter((todo) => {
                return (
                    todo.accessLevel === "view" || todo.accessLevel === "edit"
                );
            });

            // Combine with user's own todos
            return res.status(200).json({
                todos: [...todos, ...accessibleTodos],
            });
        }

        return res.status(200).json({ todos });
    } catch (error) {
        console.error("Get todos error:", error);
        return res
            .status(500)
            .json({ message: "Server error retrieving todos" });
    }
};

/**
 * Get a specific todo by ID
 */
exports.getTodoById = async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        // Check if user has permission to view this todo
        if (todo.owner.toString() === req.userId.toString()) {
            return res.status(200).json({ todo });
        }

        // Check if it's a family todo and user has access
        if (todo.familyAccess) {
            const user = await User.findById(req.userId);
            const todoOwner = await User.findById(todo.owner);

            if (
                user.family &&
                todoOwner.family &&
                user.family.toString() === todoOwner.family.toString()
            ) {
                return res.status(200).json({ todo });
            }
        }

        return res
            .status(403)
            .json({ message: "You do not have permission to view this todo" });
    } catch (error) {
        console.error("Get todo by ID error:", error);
        return res
            .status(500)
            .json({ message: "Server error retrieving todo" });
    }
};

/**
 * Update a todo
 */
exports.updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        // Check permission to update
        if (todo.owner.toString() === req.userId.toString()) {
            // Owner can update any field
            const updatedTodo = await Todo.findByIdAndUpdate(id, updates, {
                new: true,
            });
            return res.status(200).json({
                message: "Todo updated successfully",
                todo: updatedTodo,
            });
        }

        // Check if it's a family todo with edit access
        if (todo.familyAccess && todo.accessLevel === "edit") {
            const user = await User.findById(req.userId);
            const todoOwner = await User.findById(todo.owner);

            if (
                user.family &&
                todoOwner.family &&
                user.family.toString() === todoOwner.family.toString()
            ) {
                // Family members with edit access can only update specific fields
                const allowedUpdates = [
                    "completed",
                    "completedAt",
                    "description",
                ];

                // Filter out disallowed fields
                const filteredUpdates = {};
                for (const key of allowedUpdates) {
                    if (updates[key] !== undefined) {
                        filteredUpdates[key] = updates[key];
                    }
                }

                const updatedTodo = await Todo.findByIdAndUpdate(
                    id,
                    filteredUpdates,
                    { new: true },
                );
                return res.status(200).json({
                    message: "Todo updated successfully",
                    todo: updatedTodo,
                });
            }
        }

        return res.status(403).json({
            message: "You do not have permission to update this todo",
        });
    } catch (error) {
        console.error("Update todo error:", error);
        return res.status(500).json({ message: "Server error updating todo" });
    }
};

/**
 * Delete a todo
 */
exports.deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        // Only owner can delete
        if (todo.owner.toString() !== req.userId.toString()) {
            return res.status(403).json({
                message: "You do not have permission to delete this todo",
            });
        }

        await Todo.findByIdAndDelete(id);

        return res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error) {
        console.error("Delete todo error:", error);
        return res.status(500).json({ message: "Server error deleting todo" });
    }
};

/**
 * Toggle todo completion status
 */
exports.toggleComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        // Check permission to update
        if (todo.owner.toString() === req.userId.toString()) {
            // Owner can toggle completion
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date() : null;
            await todo.save();

            return res.status(200).json({
                message: `Todo marked as ${
                    todo.completed ? "completed" : "incomplete"
                }`,
                todo,
            });
        }

        // Check if it's a family todo with edit access
        if (todo.familyAccess && todo.accessLevel === "edit") {
            const user = await User.findById(req.userId);
            const todoOwner = await User.findById(todo.owner);

            if (
                user.family &&
                todoOwner.family &&
                user.family.toString() === todoOwner.family.toString()
            ) {
                todo.completed = !todo.completed;
                todo.completedAt = todo.completed ? new Date() : null;
                await todo.save();

                return res.status(200).json({
                    message: `Todo marked as ${
                        todo.completed ? "completed" : "incomplete"
                    }`,
                    todo,
                });
            }
        }

        return res.status(403).json({
            message: "You do not have permission to update this todo",
        });
    } catch (error) {
        console.error("Toggle complete error:", error);
        return res.status(500).json({ message: "Server error updating todo" });
    }
};
