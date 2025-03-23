const Family = require("../models/Family");
const User = require("../models/User");
const { hasResourcePermission } = require("../utils/authUtils");

/**
 * Create a new family
 */
exports.createFamily = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Family name is required" });
        }

        // Check if user already has a family
        const user = await User.findById(req.userId);
        if (user.family) {
            return res
                .status(400)
                .json({ message: "You already belong to a family" });
        }

        // Create new family
        const family = new Family({
            name,
            admin: req.userId,
            members: [req.userId],
        });

        await family.save();

        // Update user with family reference
        user.family = family._id;
        await user.save();

        return res.status(201).json({
            message: "Family created successfully",
            family,
        });
    } catch (error) {
        console.error("Create family error:", error);
        return res
            .status(500)
            .json({ message: "Server error creating family" });
    }
};

/**
 * Add a member to family
 */
exports.addMember = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        // Get the family
        const family = await Family.findById(req.familyId);

        // Check if requester is admin
        if (family.admin.toString() !== req.userId.toString()) {
            return res
                .status(403)
                .json({ message: "Only family admin can add members" });
        }

        // Find user to add
        const userToAdd = await User.findOne({ username });
        if (!userToAdd) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is already in another family
        if (userToAdd.family) {
            return res
                .status(400)
                .json({ message: "User already belongs to a family" });
        }

        // Check if user is already in this family
        if (family.members.includes(userToAdd._id)) {
            return res
                .status(400)
                .json({ message: "User is already a member of this family" });
        }

        // Add member to family
        family.members.push(userToAdd._id);
        await family.save();

        // Update user with family reference
        userToAdd.family = family._id;
        await userToAdd.save();

        return res.status(200).json({
            message: "Member added successfully",
            family,
        });
    } catch (error) {
        console.error("Add family member error:", error);
        return res
            .status(500)
            .json({ message: "Server error adding family member" });
    }
};

/**
 * Remove a member from family
 */
exports.removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        // Get the family
        const family = await Family.findById(req.familyId);

        // Check if requester is admin
        if (family.admin.toString() !== req.userId.toString()) {
            return res
                .status(403)
                .json({ message: "Only family admin can remove members" });
        }

        // Check if trying to remove admin
        if (family.admin.toString() === memberId) {
            return res
                .status(400)
                .json({ message: "Cannot remove family admin" });
        }

        // Check if user is in the family
        if (!family.members.includes(memberId)) {
            return res
                .status(400)
                .json({ message: "User is not a member of this family" });
        }

        // Remove member from family
        family.members = family.members.filter(
            (id) => id.toString() !== memberId,
        );
        await family.save();

        // Update user to remove family reference
        await User.findByIdAndUpdate(memberId, { $unset: { family: "" } });

        return res.status(200).json({
            message: "Member removed successfully",
            family,
        });
    } catch (error) {
        console.error("Remove family member error:", error);
        return res
            .status(500)
            .json({ message: "Server error removing family member" });
    }
};

/**
 * Get family details
 */
exports.getFamily = async (req, res) => {
    try {
        const family = await Family.findById(req.familyId)
            .populate("admin", "username")
            .populate("members", "username");

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        return res.status(200).json({ family });
    } catch (error) {
        console.error("Get family error:", error);
        return res
            .status(500)
            .json({ message: "Server error getting family details" });
    }
};
