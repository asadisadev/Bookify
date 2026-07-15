import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { emitQueueUpdate } from "../utils/queueEmitter.js";
import { generateQRPayload, renderQRImage } from "../utils/qrGenerator.js";

// Helper: strip time from a Date and return start/end of that calendar day (UTC)
const getDayRange = (date) => {
    const d = new Date(date);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const end   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
};

// ─────────────────────────────────────────────────────────────────
// @desc    Book an appointment
// @route   POST /api/appointments/book
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────
export const bookAppointment = async (req, res) => {
    try {
        const { professionalId, appointmentDate, slot } = req.body;

        // ── Validate required fields ──
        if (!professionalId || !appointmentDate || !slot) {
            return res.status(400).json({
                success: false,
                message: "professionalId, appointmentDate, and slot are required"
            });
        }

        // ── Ensure the professional exists and has that role ──
        const professional = await User.findById(professionalId);
        if (!professional || professional.role !== "Professional") {
            return res.status(404).json({
                success: false,
                message: "Professional not found"
            });
        }

        // ── Professional must have an organization ──
        if (!professional.organization) {
            return res.status(400).json({
                success: false,
                message: "This professional is not linked to any organization"
            });
        }

        const { start, end } = getDayRange(appointmentDate);

        // ── Prevent duplicate booking by the same customer ──
        const duplicate = await Appointment.findOne({
            customer:     req.user._id,
            professional: professionalId,
            appointmentDate: { $gte: start, $lte: end },
            slot,
            status:       { $nin: ["Cancelled"] }
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "You have already booked this professional for the same date and slot"
            });
        }

        // ── Auto-generate token number ──
        const lastAppointment = await Appointment.findOne({
            professional:    professionalId,
            appointmentDate: { $gte: start, $lte: end },
            slot
        })
            .sort({ tokenNumber: -1 })
            .select("tokenNumber")
            .lean();

        const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

        // ── Generate unique QR payload BEFORE saving ──
        // We need the appointment _id first, so we build the doc then save.
        const appointment = new Appointment({
            customer:        req.user._id,
            professional:    professionalId,
            organization:    professional.organization,
            appointmentDate: new Date(appointmentDate),
            slot,
            tokenNumber,
            status:          "Booked",
            paymentStatus:   "Pending",
            checkedIn:       false
        });

        // Generate the structured QR payload and store it as a JSON string
        appointment.qrCode = generateQRPayload({
            appointmentId:  appointment._id.toString(),
            customerId:     req.user._id.toString(),
            professionalId: professionalId.toString(),
            date:           appointmentDate
        });
        await appointment.save();

        // Populate for a rich response
        const populated = await appointment.populate([
            { path: "customer",     select: "name email phone" },
            { path: "professional", select: "name profession specialization" },
            { path: "organization", select: "name" }
        ]);

        // ── Emit real-time queue update to the professional's room ──
        emitQueueUpdate(professionalId, new Date(appointmentDate));

        return res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            appointment: populated
        });
    } catch (error) {
        console.error("bookAppointment Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Get logged-in customer's appointments (newest first)
// @route   GET /api/appointments/my
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────
export const getMyAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ customer: req.user._id })
            .sort({ createdAt: -1 })
            .populate("professional", "name profession specialization profileImage")
            .populate("organization", "name")
            .lean();

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        console.error("getMyAppointments Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Get today's appointments for a professional (ordered by token)
// @route   GET /api/appointments/professional/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────
export const getProfessionalAppointments = async (req, res) => {
    try {
        const { start, end } = getDayRange(new Date());

        const appointments = await Appointment.find({
            professional:    req.params.id,
            appointmentDate: { $gte: start, $lte: end }
        })
            .sort({ tokenNumber: 1 })
            .populate("customer", "name email phone profileImage")
            .populate("organization", "name")
            .lean();

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        console.error("getProfessionalAppointments Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Cancel an appointment (customer only)
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────
export const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Only the customer who booked can cancel
        if (appointment.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to cancel this appointment"
            });
        }

        // Guard against cancelling already-completed/cancelled appointments
        if (["Completed", "Cancelled"].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: `Appointment is already ${appointment.status.toLowerCase()} and cannot be cancelled`
            });
        }

        appointment.status = "Cancelled";
        if (req.body.cancelReason) {
            appointment.cancelReason = req.body.cancelReason;
        }
        await appointment.save();

        // ── Emit real-time queue update to the professional's room ──
        emitQueueUpdate(appointment.professional.toString(), appointment.appointmentDate);

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            appointment
        });
    } catch (error) {
        console.error("cancelAppointment Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Get live queue status for a professional
// @route   GET /api/appointments/queue/:professionalId
// @access  Private
// ─────────────────────────────────────────────────────────────────
export const getQueueStatus = async (req, res) => {
    try {
        const { professionalId } = req.params;
        const { start, end } = getDayRange(new Date());

        // Fetch all non-cancelled appointments for today, ordered by token
        const todayAppointments = await Appointment.find({
            professional:    professionalId,
            appointmentDate: { $gte: start, $lte: end },
            status:          { $nin: ["Cancelled"] }
        })
            .sort({ tokenNumber: 1 })
            .populate("customer", "name phone profileImage")
            .lean();

        // Currently serving = the latest CheckedIn appointment
        const currentlyServing = todayAppointments
            .filter((a) => a.status === "CheckedIn")
            .slice(-1)[0] || null;

        // Waiting customers = Booked, not yet checked in
        const waitingCustomers = todayAppointments.filter(
            (a) => a.status === "Booked"
        );

        // Remaining = CheckedIn + Booked
        const remainingAppointments = todayAppointments.filter(
            (a) => ["CheckedIn", "Booked"].includes(a.status)
        );

        // Next token = first Booked token after the current serving token
        const nextAppointment = waitingCustomers[0] || null;

        // Estimated wait: 15 min per remaining appointment
        const MINUTES_PER_APPOINTMENT = 15;
        const estimatedWaitingTime = waitingCustomers.length * MINUTES_PER_APPOINTMENT;

        return res.status(200).json({
            success: true,
            queue: {
                currentServingToken:    currentlyServing ? currentlyServing.tokenNumber : null,
                currentlyServing:       currentlyServing,
                nextToken:              nextAppointment ? nextAppointment.tokenNumber : null,
                waitingCustomers,
                remainingAppointments:  remainingAppointments.length,
                estimatedWaitingTime:   `${estimatedWaitingTime} minutes`
            }
        });
    } catch (error) {
        console.error("getQueueStatus Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Professional marks customer as checked in
// @route   PUT /api/appointments/:id/checkin
// @access  Private (Professional)
// ─────────────────────────────────────────────────────────────────
export const checkInAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Only the assigned professional can check in
        if (appointment.professional.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to check in for this appointment"
            });
        }

        if (appointment.status !== "Booked") {
            return res.status(400).json({
                success: false,
                message: `Cannot check in an appointment with status: ${appointment.status}`
            });
        }

        appointment.checkedIn = true;
        appointment.status    = "CheckedIn";
        await appointment.save();

        const populated = await appointment.populate([
            { path: "customer",  select: "name email phone" },
            { path: "organization", select: "name" }
        ]);

        // ── Emit real-time queue update to the professional's room ──
        emitQueueUpdate(appointment.professional.toString(), appointment.appointmentDate);

        return res.status(200).json({
            success: true,
            message: "Customer checked in successfully",
            appointment: populated
        });
    } catch (error) {
        console.error("checkInAppointment Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Professional marks appointment as completed (queue advances)
// @route   PUT /api/appointments/:id/complete
// @access  Private (Professional)
// ─────────────────────────────────────────────────────────────────
export const completeAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Only the assigned professional can complete
        if (appointment.professional.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to complete this appointment"
            });
        }

        if (appointment.status !== "CheckedIn") {
            return res.status(400).json({
                success: false,
                message: `Only a CheckedIn appointment can be marked as Completed. Current status: ${appointment.status}`
            });
        }

        appointment.status = "Completed";
        await appointment.save();

        // ── Advance the queue: surface the next Booked appointment ──
        const { start, end } = getDayRange(appointment.appointmentDate);

        const nextAppointment = await Appointment.findOne({
            professional:    appointment.professional,
            appointmentDate: { $gte: start, $lte: end },
            slot:            appointment.slot,
            status:          "Booked",
            tokenNumber:     { $gt: appointment.tokenNumber }
        })
            .sort({ tokenNumber: 1 });

        let nextUp = null;
        if (nextAppointment) {
            nextUp = {
                tokenNumber:   nextAppointment.tokenNumber,
                appointmentId: nextAppointment._id
            };
        }

        // ── Emit real-time queue update to the professional's room ──
        emitQueueUpdate(appointment.professional.toString(), appointment.appointmentDate);

        return res.status(200).json({
            success: true,
            message: "Appointment marked as completed",
            appointment,
            nextUp: nextUp
                ? { ...nextUp, message: "Next customer is ready to be called" }
                : { message: "No more customers in queue for this slot" }
        });
    } catch (error) {
        console.error("completeAppointment Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};
// ─────────────────────────────────────────────────────────────────
// @desc    Return the QR code image (base64 PNG) for an appointment
// @route   GET /api/appointments/:id/qrcode
// @access  Private (Customer who owns it OR the Professional)
// ─────────────────────────────────────────────────────────────────
export const getQrCode = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id).lean();

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        // Only the booking customer or the assigned professional may access
        const requesterId = req.user._id.toString();
        const isOwner        = appointment.customer.toString()    === requesterId;
        const isProfessional = appointment.professional.toString() === requesterId;

        if (!isOwner && !isProfessional) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this QR code"
            });
        }

        if (!appointment.qrCode) {
            return res.status(404).json({
                success: false,
                message: "QR code not found for this appointment"
            });
        }

        // Render the payload as a base64 PNG data-URL on the fly
        const qrImage = await renderQRImage(appointment.qrCode);

        return res.status(200).json({
            success: true,
            appointmentId: appointment._id,
            tokenNumber:   appointment.tokenNumber,
            qrPayload:     appointment.qrCode,
            qrImage                                // "data:image/png;base64,…"
        });
    } catch (error) {
        console.error("getQrCode Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// ─────────────────────────────────────────────────────────────────
// @desc    Self-service QR check-in (customer scans their own QR)
// @route   POST /api/appointments/checkin
// @access  Private (any authenticated user — typically scanned at kiosk)
// ─────────────────────────────────────────────────────────────────
export const qrCheckIn = async (req, res) => {
    try {
        const { qrCode } = req.body;

        if (!qrCode) {
            return res.status(400).json({
                success: false,
                message: "qrCode is required"
            });
        }

        // Look up appointment by the stored QR payload
        const appointment = await Appointment.findOne({ qrCode });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Invalid QR code — no matching appointment found"
            });
        }

        // ── Prevent duplicate check-in ──
        if (appointment.checkedIn || appointment.status === "CheckedIn") {
            return res.status(409).json({
                success: false,
                message: "This appointment has already been checked in"
            });
        }

        // ── Guard: only Booked appointments can be checked in ──
        if (appointment.status !== "Booked") {
            return res.status(400).json({
                success: false,
                message: `Cannot check in — appointment status is: ${appointment.status}`
            });
        }

        // ── Apply check-in ──
        appointment.checkedIn = true;
        appointment.status    = "CheckedIn";
        await appointment.save();

        const populated = await appointment.populate([
            { path: "customer",      select: "name email phone" },
            { path: "professional",  select: "name profession specialization" },
            { path: "organization",  select: "name" }
        ]);

        // ── Emit real-time queue update to the professional's room ──
        emitQueueUpdate(
            appointment.professional.toString(),
            appointment.appointmentDate
        );

        return res.status(200).json({
            success: true,
            message: "Check-in successful",
            appointment: populated
        });
    } catch (error) {
        console.error("qrCheckIn Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};
