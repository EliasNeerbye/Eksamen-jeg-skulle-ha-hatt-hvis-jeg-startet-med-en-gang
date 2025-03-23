const express = require("express");
const router = express.Router();
const familyController = require("../controllers/familyController");
const { isAuthenticated } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Family member management
router.post("/invite", familyController.inviteFamilyMember);
router.post("/respond", familyController.respondToInvitation);
router.get("/invitations", familyController.getPendingInvitations);
router.get("/members", familyController.getFamilyMembers);
router.delete("/members/:familyMemberId", familyController.removeFamilyMember);

// Todo sharing
router.post("/share", familyController.shareTodo);
router.get("/shared-todos", familyController.getSharedTodos);

module.exports = router;
