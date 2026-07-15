import jwt from "jsonwebtoken";

/**
 * Generates a JSON Web Token for the user.
 * @param {string} id - The user ID.
 * @param {string} role - The user role.
 * @returns {string} The signed JWT.
 */
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });
};

export default generateToken;
