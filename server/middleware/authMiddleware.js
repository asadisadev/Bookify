import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @desc    Middleware to protect routes (JWT verification)
 */
export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (exclude password)
            req.user = await User.findById(decoded.id);
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Not authorized, user not found"
                });
            }

            // Check if user is approved (in case a Professional's approval status changes)
            if (req.user.role === "Professional" && !req.user.isApproved) {
                return res.status(403).json({
                    success: false,
                    message: "User account is pending approval"
                });
            }

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(401).json({
                success: false,
                message: "Not authorized, token failed"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, no token provided"
        });
    }
};

/**
 * @desc    Middleware to authorize roles
 * @param   {...string} roles - List of allowed roles (e.g. 'Admin', 'Professional')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user?.role || "unknown"}' is not authorized to access this resource`
            });
        }
        next();
    };
};
