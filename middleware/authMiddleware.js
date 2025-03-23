exports.isAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    // Add userId to request for use in controllers
    req.userId = req.session.userId;
    req.isAdmin = req.session.isAdmin || false;

    next();
};

exports.hasFamilyAccess = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const User = require("../models/User");
        const user = await User.findById(req.session.userId);

        if (!user || !user.family) {
            return res.status(403).json({ message: "Family access required" });
        }

        req.familyId = user.family;
        req.userId = user._id;

        next();
    } catch (error) {
        console.error("Family access check error:", error);
        return res
            .status(500)
            .json({ message: "Server error checking family access" });
    }
};
