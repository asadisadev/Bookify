import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

/**
 * @desc    Get current user's appointments
 * @route   GET /api/appointments/my-appointments
 * @access  Private
 */
export const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let appointments;

    // Get appointments based on user role
    if (user.role === "Customer") {
      appointments = await Appointment.find({ customer: userId })
        .populate("professional", "name email profileImage profession specialization")
        .populate("organization", "name slug city")
        .sort({ appointmentDate: -1 })
        .lean();
    } else if (user.role === "Professional") {
      appointments = await Appointment.find({ professional: userId })
        .populate("customer", "name email phone profileImage")
        .populate("organization", "name slug city")
        .sort({ appointmentDate: -1 })
        .lean();
    } else if (user.role === "Admin") {
      appointments = await Appointment.find()
        .populate("customer", "name email")
        .populate("professional", "name email")
        .populate("organization", "name slug")
        .sort({ appointmentDate: -1 })
        .lean();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user role"
      });
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error("GetMyAppointments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

/**
 * @desc    Get single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("customer", "name email phone profileImage")
      .populate("professional", "name email profileImage profession specialization")
      .populate("organization", "name slug city address");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Check if user has permission
    const userId = req.user._id;
    const isCustomer = appointment.customer._id.toString() === userId.toString();
    const isProfessional = appointment.professional._id.toString() === userId.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isCustomer && !isProfessional && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this appointment"
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error("GetAppointmentById Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private (Customer)
 */
export const createAppointment = async (req, res) => {
  try {
    const {
      professional,
      organization,
      appointmentDate,
      service,
      notes,
      paymentAmount
    } = req.body;

    const customer = req.user._id;

    if (!professional || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Professional and appointment date are required"
      });
    }

    const professionalUser = await User.findById(professional);
    if (!professionalUser || professionalUser.role !== "Professional") {
      return res.status(404).json({
        success: false,
        message: "Professional not found"
      });
    }

    if (!professionalUser.isApproved) {
      return res.status(403).json({
        success: false,
        message: "This professional account is not approved yet"
      });
    }

    if (organization) {
      const org = await Organization.findById(organization);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: "Organization not found"
        });
      }
    }

    // Generate token number
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAppointments = await Appointment.countDocuments({
      professional,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const tokenNumber = todayAppointments + 1;

    const appointment = await Appointment.create({
      customer,
      professional,
      organization: organization || null,
      appointmentDate,
      tokenNumber,
      status: "Booked",
      paymentStatus: paymentAmount ? "Pending" : "Not Required",
      paymentAmount: paymentAmount || 0,
      service: service || null,
      notes: notes || null
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("customer", "name email phone")
      .populate("professional", "name email profileImage")
      .populate("organization", "name slug");

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error("CreateAppointment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

/**
 * @desc    Cancel appointment
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private (Customer or Professional)
 */
export const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    const userId = req.user._id;
    const isCustomer = appointment.customer.toString() === userId.toString();
    const isProfessional = appointment.professional.toString() === userId.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isCustomer && !isProfessional && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to cancel this appointment"
      });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment"
      });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled"
      });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment
    });
  } catch (error) {
    console.error("CancelAppointment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};