const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
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
        completedAt: {
            type: Date,
        },
        day: {
            type: Number,
            min: 1,
            max: 7,
        },
        repeats: {
            type: Boolean,
            default: false,
        },
        repeatPattern: {
            type: String,
            enum: ["daily", "weekly", "none"],
            default: "none",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        familyAccess: {
            type: Boolean,
            default: false,
        },
        accessLevel: {
            type: String,
            enum: ["private", "view", "edit"],
            default: "private",
        },
    },
    {
        timestamps: true,
    },
);

const Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;
