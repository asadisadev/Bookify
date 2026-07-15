import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            select: false
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },
        role: {
            type: String,
            enum: ["Customer", "Professional", "Admin"],
            default: "Customer",
            required: true
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            default: null
        },
        profession: {
            type: String,
            trim: true,
            default: ""
        },
        specialization: {
            type: String,
            trim: true,
            default: ""
        },
        appointmentFee: {
            type: Number,
            default: 0
        },
        averageServiceTime: {
            type: Number,
            default: 15
        },
        workingDays: {
            type: [String],
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        workingHours: {
            start: {
                type: String,
                default: "09:00"
            },
            end: {
                type: String,
                default: "17:00"
            }
        },
        profileImage: {
            type: String,
            default: ""
        },
        isApproved: {
            type: Boolean,
            default: function () {
                // Default true for Customer, false for Professional/Admin
                return this.role === "Customer";
            }
        }
    },
    {
        timestamps: true
    }
);

// Indexes for performance
userSchema.index({ role: 1 });

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
