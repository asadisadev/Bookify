import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            role,
            organization,
            profession,
            specialization,
            appointmentFee,
            workingDays,
            workingHours,
            profileImage
        } = req.body;

        // Basic validations
        if (!name || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, password, and phone number"
            });
        }

        // Professional validations
        if (role === "Professional") {
            if (!organization) {
                return res.status(400).json({
                    success: false,
                    message: "Organization is required for Professional registration"
                });
            }
            if (!profession) {
                return res.status(400).json({
                    success: false,
                    message: "Profession is required for Professional registration"
                });
            }
            if (appointmentFee === undefined || appointmentFee === null) {
                return res.status(400).json({
                    success: false,
                    message: "Appointment fee is required for Professional registration"
                });
            }
            if (!workingHours || !workingHours.start || !workingHours.end) {
                return res.status(400).json({
                    success: false,
                    message: "Working hours (start and end) are required for Professional registration"
                });
            }
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        // Create the user
        // Note: isApproved is automatically set by the default function in the User schema
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: role || "Customer",
            organization: organization || null,
            profession,
            specialization,
            appointmentFee,
            workingDays,
            workingHours,
            profileImage
        });

        if (user) {
            // Remove password before returning
            const userObj = user.toObject();
            delete userObj.password;

            res.status(201).json({
                success: true,
                message: user.role === "Professional"
                    ? "Registration successful. Your professional account is pending approval."
                    : "Registration successful.",
                token: generateToken(user._id, user.role),
                user: userObj
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid user data"
            });
        }
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email and password"
            });
        }

        // Find user & include password field
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if professional account is approved
        if (user.role === "Professional" && !user.isApproved) {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Please contact the administrator."
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Return user data (excluding password)
        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: generateToken(user._id, user.role),
            user: userObj
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};
