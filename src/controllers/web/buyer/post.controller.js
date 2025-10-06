import Joi from "joi";
import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";
import {Post} from "../../../models/post.model.js";
import { BuyLead } from "../../../models/buylead.model.js";

// create post
export const createPost = asyncHandler(async (req, res) => {
    const {Categories_id,Product_id,title,content} = req.body;
    const buyer_id = req.user._id; // from JWT auth 
    
    const post = await Post.create({
        Categories_id,
        Product_id, 
        buyer_id,
        title,
        content,
    });
    return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});


// Create new Buy Lead
export const createBuyLead = async (req, res) => {
  try {
    const {
      productName,
      quantity,
      unit,
      description,
      buyerName,
      email,
      phone,
      location,
      category,
    } = req.body;

    // Basic validation
    if (!productName || !quantity || !buyerName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const newLead = new BuyLead({
      productName,
      quantity,
      unit,
      description,
      buyerName,
      email,
      phone,
      location,
      category,
    });

    await newLead.save();

    res.status(201).json({
      success: true,
      message: "Buy lead created successfully",
      data: newLead,
    });
  } catch (error) {
    console.error("Error creating buy lead:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating buy lead",
    });
  }
};

// Get all Buy Leads
export const getAllBuyLeads = async (req, res) => {
  try {
    const leads = await BuyLead.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single lead by ID
export const getBuyLeadById = async (req, res) => {
  try {
    const lead = await BuyLead.findById(req.params.id);
    if (!lead)
      return res.status(404).json({ success: false, message: "Lead not found" });

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
