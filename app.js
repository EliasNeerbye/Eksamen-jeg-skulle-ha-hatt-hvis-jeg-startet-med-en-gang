const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const MongoStore = require("connect-mongo");

const config = require("./config/config");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
    .connect(config.MONGODB_URL)
    .then(() => {
        console.log(`Connected to mongodb with url: ${config.MONGODB_URL}!`);
    })
    .catch((err) => {
        console.error("Connection failed: ", err);
    });

app.use(
    session({
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: config.MONGODB_URL,
            collectionName: "session",
            ttl: 14 * 24 * 60 * 60,
        }),
        cookie: {
            secure: config.SSL_TYPE === "https" ? true : false,
            httpOnly: true,
            sameSite: config.SSL_TYPE === "https" ? "lax" : "none",
            maxAge: 14 * 24 * 60 * 60 * 1000,
        },
    }),
);

const origin =
    config.SSL_TYPE === "https"
        ? `${config.SSL_TYPE}://${config.APP_IP}`
        : `${config.SSL_TYPE}://${config.APP_IP}:${config.PORT}`;

app.use(
    cors({
        origin,
        credentials: true,
    }),
);

const authRoutes = require("./routes/authRoutes");
const todoRoutes = require("./routes/todoRoutes");
const getRoutes = require("./routes/getRoutes");
const familyRoutes = require("./routes/familyRoutes");

app.use("/", getRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/todo", todoRoutes);
app.use("/api/family", familyRoutes);

app.use("/api/*", (req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found" });
});

app.use((req, res) => {
    res.status(404).render("404", {
        user: req.session.userId ? { id: req.session.userId } : null,
    });
});

app.listen(config.PORT);
console.log(`App is running and listening on: ${origin}`);
