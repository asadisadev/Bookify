import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Customer reference is required"]
        },
        professional: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Professional reference is required"]
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: [true, "Organization reference is required"]
        },
        appointmentDate: {
            type: Date,
            required: [true, "Appointment date is required"]
        },
        slot: {
            type: String,
            required: [true, "Appointment slot is required"]
        },
        tokenNumber: {
            type: Number,
            required: [true, "Token number is required"]
        },
        status: {
            type: String,
            enum: ["Booked", "CheckedIn", "Completed", "Cancelled", "NoShow"],
            default: "Booked",
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Refunded"],
            default: "Pending",
            required: true
        },
        qrCode: {
            type: String,
            default: ""
        },
        checkedIn: {
            type: Boolean,
            default: false
        },
        cancelReason: {
            type: String,
            default: ""
        },
        paymentAmount: {
            type: Number,
            default: 0
        },
        commissionAmount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Indexes for performance and quick queries
appointmentSchema.index({ customer: 1 });
appointmentSchema.index({ professional: 1 });
appointmentSchema.index({ organization: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ professional: 1, appointmentDate: 1, tokenNumber: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
