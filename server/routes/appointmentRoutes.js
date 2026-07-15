import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    bookAppointment,
    getMyAppointments,
    getProfessionalAppointments,
    cancelAppointment,
    getQueueStatus,
    checkInAppointment,
    completeAppointment
} from "../controllers/appointmentController.js";

const router = express.Router();

// ── Customer Routes ───────────────────────────────────────────────
// POST /api/appointments/book        — Book an appointment (Customer)
router.post("/book", protect, authorize("Customer"), bookAppointment);

// GET  /api/appointments/my          — Get logged-in customer's appointments
router.get("/my", protect, authorize("Customer"), getMyAppointments);

// PUT  /api/appointments/:id/cancel  — Cancel own appointment (Customer)
router.put("/:id/cancel", protect, authorize("Customer"), cancelAppointment);

// ── Professional Routes ───────────────────────────────────────────
// GET  /api/appointments/professional/:id — Today's appointments for a professional
router.get("/professional/:id", protect, getProfessionalAppointments);

// PUT  /api/appointments/:id/checkin  — Mark customer checked in (Professional)
router.put("/:id/checkin", protect, authorize("Professional"), checkInAppointment);

// PUT  /api/appointments/:id/complete — Mark appointment completed (Professional)
router.put("/:id/complete", protect, authorize("Professional"), completeAppointment);

// ── Public Queue Routes ───────────────────────────────────────────
// GET  /api/appointments/queue/:professionalId — Live queue status
router.get("/queue/:professionalId", protect, getQueueStatus);

export default router;
