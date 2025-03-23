const Family = require("../models/Family");
const User = require("../models/User");

exports.createFamily = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Family name is required" });
        }

        const user = await User.findById(req.userId);
        if (user.family) {
            return res
                .status(400)
                .json({ message: "You already belong to a family" });
        }

        const family = new Family({
            name,
            admin: req.userId,
            members: [req.userId],
        });

        await family.save();

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

exports.addMember = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const family = await Family.findById(req.familyId);

        if (family.admin.toString() !== req.userId.toString()) {
            return res
                .status(403)
                .json({ message: "Only family admin can add members" });
        }

        const userToAdd = await User.findOne({ username });
        if (!userToAdd) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userToAdd.family) {
            return res
                .status(400)
                .json({ message: "User already belongs to a family" });
        }

        if (family.members.includes(userToAdd._id)) {
            return res
                .status(400)
                .json({ message: "User is already a member of this family" });
        }
        family.members.push(userToAdd._id);
        await family.save();

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

exports.removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        const family = await Family.findById(req.familyId);

        if (family.admin.toString() !== req.userId.toString()) {
            return res
                .status(403)
                .json({ message: "Only family admin can remove members" });
        }

        if (family.admin.toString() === memberId) {
            return res
                .status(400)
                .json({ message: "Cannot remove family admin" });
        }

        if (!family.members.includes(memberId)) {
            return res
                .status(400)
                .json({ message: "User is not a member of this family" });
        }

        family.members = family.members.filter(
            (id) => id.toString() !== memberId,
        );
        await family.save();

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
