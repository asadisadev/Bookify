import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createBusiness,
  getMyBusiness,
  getCategories,
  getBusinessBySlug,
  exploreBusinesses
} from "../controllers/businessController.js";

const router = express.Router();

// Public routes
router.get("/explore", exploreBusinesses);
router.get("/categories", getCategories);
router.get("/:slug", getBusinessBySlug);

// Protected routes
router.use(protect);
router.post("/", createBusiness);
router.get("/my-business", getMyBusiness);

export default router;