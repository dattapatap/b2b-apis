import Joi from "joi";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Inquiry } from "../../../models/inquiry.model.js";
import {  onlineUsers } from "../../../index.js";



export const createInquiry = asyncHandler(async (req, res) => { 
  const { product_id, seller_id, message } = req.body;
  const buyer_id = req.user._id; // from JWT auth

  const inquiry = await Inquiry.create({
    product_id,
    buyer_id,
    seller_id,
    messages: [{ sender: "buyer", text: message }],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, inquiry, "Inquiry started successfully"));
});


export const sendMessage = asyncHandler(async (req, res) => {
  const { inquiryId } = req.params;
  const { text } = req.body;
const senderRole = req.user?.role || "buyer";
  const inquiry = await Inquiry.findById(inquiryId);

  if (!inquiry) throw new ApiError(404, "Inquiry not found");

  inquiry.messages.push({ sender: senderRole, text });
  await inquiry.save();

  // find receiver
  const receiverId =
    senderRole === "buyer" ? inquiry.seller_id.toString() : inquiry.buyer_id.toString();

  const receiverSocketId = onlineUsers.get(receiverId);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", {
      inquiryId,
      text,
      sender: senderRole,
    });
  }

  if (senderRole === "buyer") {
  console.log("Message sent to seller:", inquiry.seller_id);
} else {
  console.log("Message sent to buyer:", inquiry.buyer_id);
}


  return res
    .status(200)
    .json(new ApiResponse(200, inquiry, "Message sent successfully"));
});




export const getBuyerInquiries = asyncHandler(async (req, res) => {
  const buyer_id = req.user._id;

  const inquiries = await Inquiry.find({ buyer_id })
    .populate("product_id", "name media")
    .populate("seller_id", "name verified city")
    .sort({ updatedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, inquiries, "Buyer inquiries fetched"));
});

export const getSellerInquiries = asyncHandler(async (req, res) => {
  const seller_id = req.user._id;

  const inquiries = await Inquiry.find({ seller_id })
    .populate("product_id", "name media")
    .populate("buyer_id", "name email")
    .sort({ updatedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, inquiries, "Seller inquiries fetched"));
});

export const getInquiryChat = asyncHandler(async (req, res) => {
  const { inquiryId } = req.params;

  const inquiry = await Inquiry.findById(inquiryId)
    .populate("product_id", "name media")
    .populate("buyer_id", "name email")
    .populate("seller_id", "name verified city");

  if (!inquiry) throw new ApiError(404, "Inquiry not found");

  return res
    .status(200)
    .json(new ApiResponse(200, inquiry, "Chat fetched successfully"));
});

