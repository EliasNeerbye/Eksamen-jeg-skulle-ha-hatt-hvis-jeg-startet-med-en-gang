const User = require("../models/User");

const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
        if (req.originalUrl.startsWith("/api/")) {
            return res.status(401).json({ message: "Authentication required" });
        } else {
            return res.redirect("/sign-in");
        }
    }

    next();
};

const isAdmin = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/sign-in");
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user || user.role !== "admin") {
            return res.status(403).render("error", {
                title: "Feil",
                message: "Unauthorized - Admin access required",
                isAuthenticated: !!req.session.userId,
            });
        }

        next();
    } catch (error) {
        return res.status(500).render("error", {
            title: "Feil",
            message: "Server error",
            error,
            isAuthenticated: !!req.session.userId,
        });
    }
};

module.exports = { isAuthenticated, isAdmin };
