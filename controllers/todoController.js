const Todo = require("../models/Todo");

exports.createTodo = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;

        const todo = await Todo.create({
            title,
            description,
            dueDate: dueDate || new Date(),
            owner: req.session.userId,
        });

        return res.status(201).json({ todo });
    } catch (error) {
        return res.status(500).json({
            message: "Error creating todo",
            error: error.message,
        });
    }
};

exports.getTodos = async (req, res) => {
    try {
        const todos = await Todo.find({ owner: req.session.userId }).sort({
            dueDate: 1,
        });

        return res.status(200).json({ todos });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving todos",
            error: error.message,
        });
    }
};

exports.getTodosByDate = async (req, res) => {
    try {
        const { date } = req.params;

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const todos = await Todo.find({
            owner: req.session.userId,
            dueDate: { $gte: startDate, $lte: endDate },
        }).sort({ dueDate: 1 });

        return res.status(200).json({ todos });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving todos",
            error: error.message,
        });
    }
};

exports.getTodoById = async (req, res) => {
    try {
        const { id } = req.params;

        const todo = await Todo.findOne({
            _id: id,
            owner: req.session.userId,
        });

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        return res.status(200).json({ todo });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving todo",
            error: error.message,
        });
    }
};

exports.updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed, dueDate } = req.body;

        const todo = await Todo.findOneAndUpdate(
            { _id: id, owner: req.session.userId },
            { title, description, completed, dueDate },
            { new: true, runValidators: true },
        );

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        return res.status(200).json({ todo });
    } catch (error) {
        return res.status(500).json({
            message: "Error updating todo",
            error: error.message,
        });
    }
};

exports.deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;

        const todo = await Todo.findOneAndDelete({
            _id: id,
            owner: req.session.userId,
        });

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        return res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting todo",
            error: error.message,
        });
    }
};
