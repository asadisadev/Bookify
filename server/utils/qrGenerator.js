import QRCode from "qrcode";

/**
 * Build and serialize a structured QR payload object for an appointment.
 *
 * Stored in Appointment.qrCode as a JSON string so it can be looked up
 * directly and parsed by any scanner without an extra DB round-trip.
 *
 * @param {object} params
 * @param {string} params.appointmentId
 * @param {string} params.customerId
 * @param {string} params.professionalId
 * @param {Date|string} params.date  — appointmentDate
 * @returns {string}  — JSON string stored in the DB
 */
export const generateQRPayload = ({ appointmentId, customerId, professionalId, date }) => {
    const payload = {
        appointmentId,
        customerId,
        professionalId,
        date: new Date(date).toISOString().split("T")[0]   // "YYYY-MM-DD"
    };
    return JSON.stringify(payload);
};

/**
 * Render a QR payload string (or any string) as a base64-encoded PNG data-URL.
 *
 * @param {string} payload  — the JSON string stored in Appointment.qrCode
 * @returns {Promise<string>} — "data:image/png;base64,…"
 */
export const renderQRImage = async (payload) => {
    return await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
        color: {
            dark:  "#1a1a2e",   // deep navy dots
            light: "#ffffff"
        }
    });
};
