const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        dueDate: {
            type: Date,
            required: [true, "Due date is required"],
            default: () => new Date(),
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

TodoSchema.index({ owner: 1, dueDate: 1 });

const Todo = mongoose.model("Todo", TodoSchema);

module.exports = Todo;
