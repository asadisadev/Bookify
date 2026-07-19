import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getAllBusinesses,
  verifyBusiness,
  getAllUsers,
  deleteUser
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes are protected and require admin role
router.use(protect);
router.use(authorize("Admin"));

router.get("/businesses", getAllBusinesses);
router.put("/businesses/:id/verify", verifyBusiness);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;