import Joi from "joi";
import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Notification} from "../../models/notification.model.js";
import { sendNotification } from "../../utils/notification.js";

// Create new notification
export const createNotification = async (req, res) => {
    try {
        const {userId, title, message, type} = req.body;

        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
        });

        // Real-time send using socket.io
        sendNotification(userId, {
            title,
            message,
            type,
            createdAt: notification.createdAt,
        });

        res.status(201).json({
            success: true,
            message: "Notification created and sent",
            data: notification,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({success: false, message: "Server error"});
    }
};

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
    try {
        const {userId} = req.params;
        const notifications = await Notification.find({userId}).sort({createdAt: -1});
        res.json({success: true, data: notifications});
    } catch (error) {
        res.status(500).json({success: false, message: "Server error"});
    }
};
