const mongoose = require("mongoose");

const FamilyMemberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        familyMember: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    },
);

FamilyMemberSchema.index({ user: 1, familyMember: 1 }, { unique: true });

const FamilyMember = mongoose.model("FamilyMember", FamilyMemberSchema);

module.exports = FamilyMember;
