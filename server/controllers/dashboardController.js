import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

// ─── Shared helper ────────────────────────────────────────────────────────────
const getTodayRange = () => {
    const now   = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer Dashboard
// @route   GET /api/dashboard/customer
// @access  Private (Customer)
// ─────────────────────────────────────────────────────────────────────────────
export const getCustomerDashboard = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { start }  = getTodayRange();   // "today or later" for upcoming

        // Run all aggregations in parallel
        const [statusCounts, upcomingAppointments] = await Promise.all([

            // ── Appointment counts grouped by status ──────────────────────
            Appointment.aggregate([
                { $match: { customer: customerId } },
                {
                    $group: {
                        _id:   "$status",
                        count: { $sum: 1 }
                    }
                }
            ]),

            // ── Upcoming: Booked appointments from today onward ───────────
            Appointment.find({
                customer:        customerId,
                status:          "Booked",
                appointmentDate: { $gte: start }
            })
                .sort({ appointmentDate: 1, tokenNumber: 1 })
                .limit(5)
                .populate("professional", "name profession specialization profileImage")
                .populate("organization", "name city")
                .lean()
        ]);

        // Flatten status counts into a lookup map
        const counts = { Booked: 0, CheckedIn: 0, Completed: 0, Cancelled: 0, NoShow: 0 };
        statusCounts.forEach(({ _id, count }) => {
            if (_id in counts) counts[_id] = count;
        });

        const totalAppointments = Object.values(counts).reduce((a, b) => a + b, 0);

        return res.status(200).json({
            success: true,
            dashboard: {
                totalAppointments,
                pendingAppointments:    counts.Booked + counts.CheckedIn,
                completedAppointments:  counts.Completed,
                cancelledAppointments:  counts.Cancelled,
                upcomingAppointments
            }
        });
    } catch (error) {
        console.error("getCustomerDashboard Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Professional Dashboard
// @route   GET /api/dashboard/professional
// @access  Private (Professional)
// ─────────────────────────────────────────────────────────────────────────────
export const getProfessionalDashboard = async (req, res) => {
    try {
        const professionalId = req.user._id;
        const { start, end } = getTodayRange();

        // All of today's non-cancelled appointments, ordered by token
        const [todayAppointments, revenueResult] = await Promise.all([

            Appointment.find({
                professional:    professionalId,
                appointmentDate: { $gte: start, $lte: end }
            })
                .sort({ tokenNumber: 1 })
                .populate("customer", "name phone profileImage")
                .lean(),

            // ── Today's revenue: sum paymentAmount for Completed + Paid ──
            Appointment.aggregate([
                {
                    $match: {
                        professional:    professionalId,
                        appointmentDate: { $gte: start, $lte: end },
                        status:          "Completed",
                        paymentStatus:   "Paid"
                    }
                },
                {
                    $group: {
                        _id:           null,
                        totalRevenue:  { $sum: "$paymentAmount" }
                    }
                }
            ])
        ]);

        // Derive sub-sets from the single query result
        const activeTodayAppts  = todayAppointments.filter(a => a.status !== "Cancelled");
        const completedToday    = todayAppointments.filter(a => a.status === "Completed");
        const pendingToday      = todayAppointments.filter(a => a.status === "Booked");
        const waitingCustomers  = todayAppointments.filter(a => a.status === "Booked");
        const currentlyServing  = todayAppointments
            .filter(a => a.status === "CheckedIn")
            .slice(-1)[0] || null;

        const todayRevenue = revenueResult[0]?.totalRevenue ?? 0;

        return res.status(200).json({
            success: true,
            dashboard: {
                todayAppointments:      activeTodayAppts.length,
                currentServingToken:    currentlyServing ? currentlyServing.tokenNumber : null,
                currentlyServing,
                waitingCustomers:       waitingCustomers.length,
                completedToday:         completedToday.length,
                todayRevenue,
                todayPendingAppointments: pendingToday.length,
                // Full list so the UI can render a live queue board
                appointmentsList:       activeTodayAppts
            }
        });
    } catch (error) {
        console.error("getProfessionalDashboard Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin Dashboard
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAdminDashboard = async (req, res) => {
    try {
        const { start, end } = getTodayRange();

        // Fire all aggregations concurrently for maximum performance
        const [
            userStats,
            orgStats,
            totalAppointments,
            todayAppointments
        ] = await Promise.all([

            // ── User stats ────────────────────────────────────────────────
            User.aggregate([
                {
                    $group: {
                        _id:               "$role",
                        total:             { $sum: 1 },
                        pendingApproval:   {
                            $sum: {
                                $cond: [{ $eq: ["$isApproved", false] }, 1, 0]
                            }
                        }
                    }
                }
            ]),

            // ── Organization stats ────────────────────────────────────────
            Organization.aggregate([
                {
                    $group: {
                        _id:     null,
                        total:   { $sum: 1 },
                        pending: {
                            $sum: {
                                $cond: [{ $eq: ["$isApproved", false] }, 1, 0]
                            }
                        }
                    }
                }
            ]),

            // ── Total appointments (all time) ─────────────────────────────
            Appointment.countDocuments(),

            // ── Today's appointments count ────────────────────────────────
            Appointment.countDocuments({
                appointmentDate: { $gte: start, $lte: end }
            })
        ]);

        // Flatten user aggregation into a readable map
        const users = { Customer: 0, Professional: 0, Admin: 0 };
        const pendingProfessionals = { count: 0 };

        userStats.forEach(({ _id, total, pendingApproval }) => {
            if (_id in users) users[_id] = total;
            if (_id === "Professional") pendingProfessionals.count = pendingApproval;
        });

        const totalUsers = users.Customer + users.Professional + users.Admin;
        const orgData    = orgStats[0] || { total: 0, pending: 0 };

        return res.status(200).json({
            success: true,
            dashboard: {
                totalUsers,
                totalCustomers:        users.Customer,
                totalProfessionals:    users.Professional,
                pendingProfessionals:  pendingProfessionals.count,
                totalOrganizations:    orgData.total,
                pendingOrganizations:  orgData.pending,
                totalAppointments,
                todayAppointments
            }
        });
    } catch (error) {
        console.error("getAdminDashboard Error:", error);
        return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};
