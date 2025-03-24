const express = require("express");
const router = express.Router();
const familyController = require("../controllers/familyController");
const { isAuthenticated } = require("../middleware/auth");

router.use(isAuthenticated);

router.post("/invite", familyController.inviteFamilyMember);
router.post("/respond", familyController.respondToInvitation);
router.get("/invitations", familyController.getPendingInvitations);
router.get("/members", familyController.getFamilyMembers);
router.delete("/members/:familyMemberId", familyController.removeFamilyMember);

router.post("/share", familyController.shareTodo);
router.get("/shared-todos", familyController.getSharedTodos);

module.exports = router;
