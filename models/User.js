const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
