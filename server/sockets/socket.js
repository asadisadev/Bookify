import { Server } from "socket.io";

let io; // module-level singleton

/**
 * Initialize Socket.IO and attach it to the HTTP server.
 * Call this once from server.js, passing the raw http.Server instance.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server}
 */
export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",          // tighten in production
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // ── Join a professional's queue room ──────────────────────────
        // Client emits:  socket.emit("join_queue", { professionalId })
        socket.on("join_queue", ({ professionalId }) => {
            if (!professionalId) return;

            const room = `queue_${professionalId}`;
            socket.join(room);
            console.log(`📥 Socket ${socket.id} joined room: ${room}`);

            socket.emit("joined_queue", {
                success: true,
                room,
                message: `Joined queue room for professional ${professionalId}`
            });
        });

        // ── Leave a professional's queue room ─────────────────────────
        // Client emits:  socket.emit("leave_queue", { professionalId })
        socket.on("leave_queue", ({ professionalId }) => {
            if (!professionalId) return;

            const room = `queue_${professionalId}`;
            socket.leave(room);
            console.log(`📤 Socket ${socket.id} left room: ${room}`);
        });

        // ── Disconnect ────────────────────────────────────────────────
        socket.on("disconnect", (reason) => {
            console.log(`❌ Socket disconnected: ${socket.id} — reason: ${reason}`);
        });
    });

    console.log("✅ Socket.IO initialized");
    return io;
};

/**
 * Return the already-initialized Socket.IO instance.
 * Throws if called before initSocket().
 *
 * @returns {import("socket.io").Server}
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized. Call initSocket() first.");
    }
    return io;
};
