import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
    bookAppointment,
    getMyAppointments,
    getProfessionalAppointments,
    cancelAppointment,
    getQueueStatus,
    checkInAppointment,
    completeAppointment,
    getQrCode,
    qrCheckIn
} from "../controllers/appointmentController.js";

const router = express.Router();

// ── Customer Routes ───────────────────────────────────────────────
// POST /api/appointments/book        — Book an appointment (Customer)
router.post("/book", protect, authorize("Customer"), bookAppointment);

// POST /api/appointments/checkin     — Self-service QR check-in (any auth user)
// ⚠ Must be declared BEFORE /:id routes to avoid Express treating "checkin" as an :id
router.post("/checkin", protect, qrCheckIn);

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

// GET  /api/appointments/:id/qrcode  — Get QR image for an appointment
router.get("/:id/qrcode", protect, getQrCode);

export default router;
