const mongoose = require("mongoose");
const validator = require("validator");
const argon2 = require("argon2");

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, "Please provide a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
    },
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        this.password = await argon2.hash(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

UserSchema.methods.verifyPassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw new Error(error);
    }
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
