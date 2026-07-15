import Appointment from "../models/Appointment.js";
import { getIO } from "../sockets/socket.js";

const MINUTES_PER_APPOINTMENT = 15;

/**
 * Helper: build UTC day boundaries for a given date.
 */
const getDayRange = (date) => {
    const d = new Date(date);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const end   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
};

/**
 * Fetch today's queue snapshot for a professional and emit it to all
 * sockets in the room  `queue_<professionalId>`.
 *
 * Call this after any appointment state change (book, cancel, check-in, complete).
 *
 * @param {string} professionalId  — Mongoose ObjectId string
 * @param {Date}   [referenceDate] — defaults to today (UTC)
 */
export const emitQueueUpdate = async (professionalId, referenceDate = new Date()) => {
    try {
        const { start, end } = getDayRange(referenceDate);

        // All active (non-cancelled) appointments today, ordered by token
        const todayAppointments = await Appointment.find({
            professional:    professionalId,
            appointmentDate: { $gte: start, $lte: end },
            status:          { $nin: ["Cancelled"] }
        })
            .sort({ tokenNumber: 1 })
            .populate("customer", "name phone profileImage")
            .lean();

        // Currently serving = last CheckedIn appointment (most recently called)
        const currentlyServing = todayAppointments
            .filter((a) => a.status === "CheckedIn")
            .slice(-1)[0] || null;

        // Waiting = Booked but not yet called
        const waitingCustomers = todayAppointments.filter(
            (a) => a.status === "Booked"
        );

        // Remaining = CheckedIn + Booked
        const remainingAppointments = todayAppointments.filter(
            (a) => ["CheckedIn", "Booked"].includes(a.status)
        );

        // Next in line
        const nextAppointment = waitingCustomers[0] || null;

        const estimatedWaitingTime = waitingCustomers.length * MINUTES_PER_APPOINTMENT;

        const payload = {
            currentServingToken:   currentlyServing ? currentlyServing.tokenNumber : null,
            currentlyServing,
            nextToken:             nextAppointment ? nextAppointment.tokenNumber : null,
            waitingCustomers,
            remainingAppointments: remainingAppointments.length,
            estimatedWaitingTime:  `${estimatedWaitingTime} minutes`
        };

        const room = `queue_${professionalId}`;
        getIO().to(room).emit("queue_updated", payload);

        console.log(`📡 Emitted queue_updated to room ${room}`);
    } catch (error) {
        // Emit failures should never crash the HTTP response
        console.error("emitQueueUpdate Error:", error.message);
    }
};
