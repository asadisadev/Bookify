import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  createAppointment
} from "../controllers/appointmentController.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Get current user's appointments
router.get("/my-appointments", getMyAppointments);

// Get single appointment
router.get("/:id", getAppointmentById);

// Create appointment
router.post("/", createAppointment);

// Cancel appointment
router.put("/:id/cancel", cancelAppointment);

export default router;