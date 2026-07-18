import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config();

// Debug: Check if env variables are loaded
console.log("=== Environment Check ===");
console.log(`PORT: ${process.env.PORT || "Not set"}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? "✅ Set" : "❌ Not Set"}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set"}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || "Not set"}`);
console.log("=========================");

// Exit if required environment variables are missing
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is required but not set in .env file");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is required but not set in .env file");
    process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration - Fixed
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// REMOVED the problematic line: app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests (for debugging)
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointments", appointmentRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
        res.status(200).json({
            status: "OK",
            message: "Server is running",
            timestamp: new Date().toISOString(),
            mongoDB: mongoStatus,
            mongoState: mongoose.connection.readyState
        });
    } catch (error) {
        res.status(500).json({
            status: "ERROR",
            message: error.message,
            mongoDB: "Error checking connection"
        });
    }
});

// Root route
app.get("/", (req, res) => {
    res.json({
        message: "Queue-Pilot API Server",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            dashboard: "/api/dashboard",
            appointments: "/api/appointments",
            health: "/api/health"
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});