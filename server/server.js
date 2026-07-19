import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();

// Debug
console.log("=== Environment Check ===");
console.log(`PORT: ${process.env.PORT || "Not set"}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? "✅ Set" : "❌ Not Set"}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? "✅ Set" : "❌ Not Set"}`);
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || "Not set"}`);
console.log("=========================");

if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is required");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is required");
    process.exit(1);
}

connectDB();

const app = express();

// CORS configuration - FIXED: Removed app.options('*', cors())
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "https://bookify-4odk1hgx8-asadisadev.vercel.app",
        "https://bookify.vercel.app",
        "https://*.vercel.app",
        "https://*.railway.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// DO NOT use app.options('*', cors()) - it causes the path-to-regexp error

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
app.use("/api/business", businessRoutes);
app.use("/api/admin", adminRoutes);

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
            business: "/api/business",
            admin: "/api/admin",
            health: "/api/health"
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});