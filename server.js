require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const familyRoutes = require("./routes/familyRoutes");
const viewRoutes = require("./routes/viewRoutes");
const connectDB = require("./config/db");
const { isAuthenticated } = require("./middleware/auth");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "development"
                ? ["http://localhost:3000", "http://localhost:5173"]
                : [process.env.APP_URL],
        credentials: true,
    }),
);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: `mongodb://${process.env.MONGO_URL}/${process.env.MONGO_DB}`,
            ttl: 14 * 24 * 60 * 60,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        },
    }),
);

// Make user available to all templates
app.use(async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            res.locals.user = user
                ? {
                      id: user._id,
                      username: user.username,
                      email: user.email,
                  }
                : null;
        } else {
            res.locals.user = null;
        }
        next();
    } catch (error) {
        console.error("Error fetching user:", error);
        res.locals.user = null;
        next();
    }
});

// Routes
app.use("/", viewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/family", familyRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
