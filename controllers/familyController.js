const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const Todo = require("../models/Todo");

exports.inviteFamilyMember = async (req, res) => {
    try {
        const { email } = req.body;

        const invitedUser = await User.findOne({ email });

        if (!invitedUser) {
            return res
                .status(404)
                .json({ message: "User not found with that email" });
        }

        if (invitedUser._id.toString() === req.session.userId) {
            return res.status(400).json({
                message: "You cannot add yourself as a family member",
            });
        }

        const existingRelationship = await FamilyMember.findOne({
            user: req.session.userId,
            familyMember: invitedUser._id,
        });

        if (existingRelationship) {
            return res.status(400).json({
                message: `Invitation already ${existingRelationship.status}`,
                status: existingRelationship.status,
            });
        }

        const familyRelationship = await FamilyMember.create({
            user: req.session.userId,
            familyMember: invitedUser._id,
            status: "pending",
        });

        return res.status(201).json({
            message: "Invitation sent successfully",
            familyRelationship,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error sending invitation",
            error: error.message,
        });
    }
};

exports.respondToInvitation = async (req, res) => {
    try {
        const { invitationId, action } = req.body;

        if (!["accepted", "rejected"].includes(action)) {
            return res.status(400).json({ message: "Invalid action" });
        }

        const invitation = await FamilyMember.findOne({
            _id: invitationId,
            familyMember: req.session.userId,
            status: "pending",
        });

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        invitation.status = action;
        await invitation.save();

        return res.status(200).json({
            message: `Invitation ${action} successfully`,
            invitation,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error responding to invitation",
            error: error.message,
        });
    }
};

exports.getPendingInvitations = async (req, res) => {
    try {
        const pendingInvitations = await FamilyMember.find({
            familyMember: req.session.userId,
            status: "pending",
        }).populate("user", "username email");

        return res.status(200).json({ pendingInvitations });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving pending invitations",
            error: error.message,
        });
    }
};

exports.getFamilyMembers = async (req, res) => {
    try {
        const sentRelationships = await FamilyMember.find({
            user: req.session.userId,
            status: "accepted",
        }).populate("familyMember", "username email");

        const receivedRelationships = await FamilyMember.find({
            familyMember: req.session.userId,
            status: "accepted",
        }).populate("user", "username email");

        const familyMembers = [
            ...sentRelationships.map((rel) => ({
                id: rel.familyMember._id,
                username: rel.familyMember.username,
                email: rel.familyMember.email,
                relationshipId: rel._id,
            })),
            ...receivedRelationships.map((rel) => ({
                id: rel.user._id,
                username: rel.user.username,
                email: rel.user.email,
                relationshipId: rel._id,
            })),
        ];

        return res.status(200).json({ familyMembers });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving family members",
            error: error.message,
        });
    }
};

exports.removeFamilyMember = async (req, res) => {
    try {
        const { familyMemberId } = req.params;

        const deleted = await FamilyMember.deleteOne({
            $or: [
                { user: req.session.userId, familyMember: familyMemberId },
                { user: familyMemberId, familyMember: req.session.userId },
            ],
            status: "accepted",
        });

        if (deleted.deletedCount === 0) {
            return res
                .status(404)
                .json({ message: "Family member relationship not found" });
        }

        await Todo.updateMany(
            { owner: req.session.userId, sharedWith: familyMemberId },
            { $pull: { sharedWith: familyMemberId } },
        );

        return res
            .status(200)
            .json({ message: "Family member removed successfully" });
    } catch (error) {
        return res.status(500).json({
            message: "Error removing family member",
            error: error.message,
        });
    }
};

exports.shareTodo = async (req, res) => {
    try {
        const { todoId, familyMemberIds, allowEdit } = req.body;

        const todo = await Todo.findOne({
            _id: todoId,
            owner: req.session.userId,
        });

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        const familyMemberRelationships = await FamilyMember.find({
            $or: [
                {
                    user: req.session.userId,
                    familyMember: { $in: familyMemberIds },
                    status: "accepted",
                },
                {
                    user: { $in: familyMemberIds },
                    familyMember: req.session.userId,
                    status: "accepted",
                },
            ],
        });

        const validFamilyMemberIds = familyMemberRelationships.map((rel) =>
            rel.user.toString() === req.session.userId.toString()
                ? rel.familyMember.toString()
                : rel.user.toString(),
        );

        const invalidIds = familyMemberIds.filter(
            (id) => !validFamilyMemberIds.includes(id),
        );
        if (invalidIds.length > 0) {
            return res.status(400).json({
                message: "Some provided IDs are not valid family members",
                invalidIds,
            });
        }

        todo.sharedWith = familyMemberIds;
        if (allowEdit !== undefined) {
            todo.allowEdit = allowEdit;
        }

        await todo.save();

        return res.status(200).json({
            message: "Todo shared successfully",
            todo,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error sharing todo",
            error: error.message,
        });
    }
};

exports.getSharedTodos = async (req, res) => {
    try {
        const sharedTodos = await Todo.find({
            sharedWith: req.session.userId,
        }).populate("owner", "username");

        return res.status(200).json({ sharedTodos });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving shared todos",
            error: error.message,
        });
    }
};
