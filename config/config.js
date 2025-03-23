require("dotenv").config();

const MONGODB_URL =
    process.env.NODE_ENV === "production"
        ? `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}/${process.env.MONGO_DB}?authSource=${process.env.MONGO_AUTH}`
        : `mongodb://${process.env.MONGO_URL}/${process.env.MONGO_DB}`;

const config = {
    MONGODB_URL,
    APP_IP: process.env.APP_IP,
    PORT: process.env.PORT || 3000,
    SESSION_SECRET: process.env.SESSION_SECRET || "fancy_secret_key",
    SSL_TYPE: process.env.SSL_TYPE || "http",
    NODE_ENV: process.env.NODE_ENV || "development",
};

module.exports = config;
