const express = require("express");
const router = express.Router();
const familyController = require("../controllers/familyController");
const { isAuth, hasFamilyAccess } = require("../middleware/authMiddleware");

// Create new family (requires authentication)
router.post("/", isAuth, familyController.createFamily);

// Family operations (requires family access)
router.get("/", isAuth, hasFamilyAccess, familyController.getFamily);
router.post("/members", isAuth, hasFamilyAccess, familyController.addMember);
router.delete(
    "/members/:memberId",
    isAuth,
    hasFamilyAccess,
    familyController.removeMember,
);

module.exports = router;
