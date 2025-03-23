const Todo = require("../models/Todo");

exports.createTodo = async (req, res) => {
    try {
        const { title, description, dueDate, sharedWith, allowEdit } = req.body;

        const todo = await Todo.create({
            title,
            description,
            dueDate: dueDate || new Date(),
            owner: req.session.userId,
            sharedWith: sharedWith || [],
            allowEdit: allowEdit || false,
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
        // Get own todos
        const ownTodos = await Todo.find({ owner: req.session.userId }).sort({
            dueDate: 1,
        });

        // Get shared todos if includeShared is true
        const { includeShared } = req.query;
        let sharedTodos = [];

        if (includeShared === "true") {
            sharedTodos = await Todo.find({
                sharedWith: req.session.userId,
            })
                .populate("owner", "username email")
                .sort({ dueDate: 1 });
        }

        return res.status(200).json({
            ownTodos,
            sharedTodos,
            combined: [...ownTodos, ...sharedTodos].sort(
                (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
            ),
        });
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
        const { includeShared } = req.query;

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        // Get own todos for the date
        const ownTodos = await Todo.find({
            owner: req.session.userId,
            dueDate: { $gte: startDate, $lte: endDate },
        }).sort({ dueDate: 1 });

        // Get shared todos for the date if requested
        let sharedTodos = [];
        if (includeShared === "true") {
            sharedTodos = await Todo.find({
                sharedWith: req.session.userId,
                dueDate: { $gte: startDate, $lte: endDate },
            })
                .populate("owner", "username email")
                .sort({ dueDate: 1 });
        }

        return res.status(200).json({
            ownTodos,
            sharedTodos,
            combined: [...ownTodos, ...sharedTodos].sort(
                (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
            ),
        });
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

        // Find todo that's either owned by the user or shared with the user
        const todo = await Todo.findOne({
            _id: id,
            $or: [
                { owner: req.session.userId },
                { sharedWith: req.session.userId },
            ],
        }).populate("owner", "username email");

        if (!todo) {
            return res
                .status(404)
                .json({ message: "Todo not found or access denied" });
        }

        // Add a flag to indicate if this is a shared todo
        const isOwner = todo.owner._id.toString() === req.session.userId;
        const canEdit =
            isOwner ||
            (todo.allowEdit && todo.sharedWith.includes(req.session.userId));

        return res.status(200).json({
            todo,
            access: {
                isOwner,
                canEdit,
            },
        });
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
        const {
            title,
            description,
            completed,
            dueDate,
            sharedWith,
            allowEdit,
        } = req.body;

        // First find the todo to check permissions
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        // Check permissions
        const isOwner = todo.owner.toString() === req.session.userId;
        const canEdit =
            isOwner ||
            (todo.allowEdit && todo.sharedWith.includes(req.session.userId));

        if (!canEdit) {
            return res.status(403).json({
                message: "You don't have permission to edit this todo",
            });
        }

        // Prepare update object
        const updateData = { title, description, completed, dueDate };

        // Only the owner can update sharing settings
        if (isOwner) {
            if (sharedWith !== undefined) updateData.sharedWith = sharedWith;
            if (allowEdit !== undefined) updateData.allowEdit = allowEdit;
        }

        // Perform update
        const updatedTodo = await Todo.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({ todo: updatedTodo });
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

        // First find the todo to check permissions
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        // Only the owner can delete todos
        if (todo.owner.toString() !== req.session.userId) {
            return res
                .status(403)
                .json({ message: "Only the owner can delete a todo" });
        }

        // Delete todo
        await Todo.findByIdAndDelete(id);

        return res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting todo",
            error: error.message,
        });
    }
};
