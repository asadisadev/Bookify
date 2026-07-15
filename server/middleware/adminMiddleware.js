/**
 * @desc    Middleware to restrict access to Admin role only
 * @pre     Should be run after the 'protect' middleware which defines req.user
 */
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "Admin") {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin role required."
        });
    }
};
