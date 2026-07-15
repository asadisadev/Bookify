import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();


// Connect Database
await connectDB();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Queue Pilot API Running 🚀"
    });
});

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Queue Pilot API is healthy",
        database: "disconnected"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});