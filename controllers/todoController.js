const Todo = require("../models/Todo");
const User = require("../models/User");
const Family = require("../models/Family");

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

        if (day && (day < 1 || day > 7)) {
            return res
                .status(400)
                .json({ message: "Day must be between 1 and 7" });
        }

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

exports.getAllTodos = async (req, res) => {
    try {
        const { day } = req.query;

        let query = { owner: req.userId };

        if (day) {
            query.day = parseInt(day);
        }

        const todos = await Todo.find(query);

        const user = await User.findById(req.userId);
        if (user.family) {
            const family = await Family.findById(user.family);

            const familyTodos = await Todo.find({
                owner: { $in: family.members },
                owner: { $ne: req.userId },
                familyAccess: true,
            });

            const accessibleTodos = familyTodos.filter((todo) => {
                return (
                    todo.accessLevel === "view" || todo.accessLevel === "edit"
                );
            });

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

exports.getTodoById = async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        if (todo.owner.toString() === req.userId.toString()) {
            return res.status(200).json({ todo });
        }

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

exports.updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        if (todo.owner.toString() === req.userId.toString()) {
            const updatedTodo = await Todo.findByIdAndUpdate(id, updates, {
                new: true,
            });
            return res.status(200).json({
                message: "Todo updated successfully",
                todo: updatedTodo,
            });
        }

        if (todo.familyAccess && todo.accessLevel === "edit") {
            const user = await User.findById(req.userId);
            const todoOwner = await User.findById(todo.owner);

            if (
                user.family &&
                todoOwner.family &&
                user.family.toString() === todoOwner.family.toString()
            ) {
                const allowedUpdates = [
                    "completed",
                    "completedAt",
                    "description",
                ];

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

exports.deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

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

exports.toggleComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        if (todo.owner.toString() === req.userId.toString()) {
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
