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

// ============================================
// COMPLETE CORS FIX - Allow all origins
// ============================================

// Middleware to handle CORS manually (most reliable)
app.use((req, res, next) => {
    // Allow all origins
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours cache for preflight
    
    // Handle preflight requests immediately
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Additional CORS with cors package (as backup)
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400 // 24 hours
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log all requests with origin
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    console.log(`📡 Origin: ${req.headers.origin || 'No origin'}`);
    console.log(`📡 User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check - Must be before other routes
app.get("/api/health", (req, res) => {
    try {
        const mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
        res.status(200).json({
            status: "OK",
            message: "Server is running",
            timestamp: new Date().toISOString(),
            mongoDB: mongoStatus,
            mongoState: mongoose.connection.readyState,
            environment: process.env.NODE_ENV || 'development'
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
        status: "running",
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/admin", adminRoutes);

// Test route for CORS
app.get("/api/test-cors", (req, res) => {
    res.json({
        success: true,
        message: "CORS is working!",
        origin: req.headers.origin || 'No origin',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
app.use("/api/*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`,
        availableEndpoints: {
            auth: "/api/auth (POST /register, POST /login, GET /me)",
            dashboard: "/api/dashboard (GET /customer, /professional, /admin)",
            appointments: "/api/appointments (GET, POST, PUT)",
            business: "/api/business (GET, POST)",
            admin: "/api/admin (GET, PUT)",
            health: "/api/health (GET)"
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("❌ Global error handler:", err);
    console.error("❌ Error stack:", err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Test CORS: http://localhost:${PORT}/api/test-cors`);
    console.log(`📡 Allowed origins: All origins (CORS enabled)`);
});