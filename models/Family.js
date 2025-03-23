const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true },
);

const Family = mongoose.model("Family", familySchema);
module.exports = Family;
