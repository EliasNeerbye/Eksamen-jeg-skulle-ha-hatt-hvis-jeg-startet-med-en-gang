const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        let connectionString = "";

        if (process.env.MONGO_USER && process.env.MONGO_PWD) {
            connectionString = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_URL}/${process.env.MONGO_DB}`;
            if (process.env.MONGO_AUTH) {
                connectionString += `?authSource=${process.env.MONGO_AUTH}`;
            }
        } else {
            connectionString = `mongodb://${process.env.MONGO_URL}/${process.env.MONGO_DB}`;
        }

        await mongoose.connect(connectionString);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
