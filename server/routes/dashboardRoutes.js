import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    getCustomerDashboard,
    getProfessionalDashboard,
    getAdminDashboard
} from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/customer  — Customer only
router.get("/customer", protect, authorize("Customer"), getCustomerDashboard);

// GET /api/dashboard/professional  — Professional only
router.get("/professional", protect, authorize("Professional"), getProfessionalDashboard);

// GET /api/dashboard/admin  — Admin only
router.get("/admin", protect, authorize("Admin"), getAdminDashboard);

export default router;
