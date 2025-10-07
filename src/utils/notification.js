import { ioInstance } from "../index.js";

// Send real-time notification via Socket.IO
export const sendNotification = (userId, title, message, type = "general") => {
    if (ioInstance) {
        ioInstance.to(userId).emit("newNotification", { title, message, type });
    }
};
