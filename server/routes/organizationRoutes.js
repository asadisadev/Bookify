import express from "express";
import {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    approveOrganization
} from "../controllers/organizationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);

// Protected routes
router.post("/", protect, createOrganization);
router.put("/:id/approve", protect, adminOnly, approveOrganization);

export default router;
