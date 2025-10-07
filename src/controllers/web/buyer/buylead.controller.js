import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { BuyLead } from "../../../models/buylead.model.js";
import { User } from "../../../models/user.model.js"; // seller users
import { sendNotification } from "../../../utils/notification.js";


export const createBuyLead = asyncHandler(async (req, res) => {
    const { productName, quantity, phone,unit, description, category } = req.body;

    if (!productName || !quantity) {
        res.status(400);
        throw new Error("Please fill required fields");
    }

    // Create new BuyLead
    const newLead = await BuyLead.create({
        productName,
        quantity,
        unit,
        description,
        category,
        phone,
        buyerId: req.user.id, 
    });

    const sellers = await User.find({ role: "seller", category });
    sellers.forEach(seller => {
        sendNotification(
            seller._id.toString(),
            "New Buy Lead",
            `A new buy lead for ${productName} has been posted`,
            "buyLead"
        );
    });

    res.status(201).json({
        success: true,
        message: "Buy lead created successfully",
        data: newLead
    });
});
//  Get all Buy Leads
export const getAllBuyLeads = asyncHandler(async (req, res) => {
    const leads = await BuyLead.find()
        .populate("buyerId", "buyerName email") 
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: leads.length,
        data: leads
    });
});
// Get Buy Lead by ID
export const getBuyLeadById = asyncHandler(async (req, res) => {
    const lead = await BuyLead.findById(req.params.id)
        .populate("buyerId", "buyerName email");

    if (!lead) {
        res.status(404);
        throw new Error("Buy lead not found");
    }

    res.status(200).json({
        success: true,
        data: lead
    });
});
// Update Buy Lead status
export const updateBuyLeadStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // expected: "pending", "approved", "closed"

    if (!["pending", "approved", "closed"].includes(status)) {
        res.status(400);
        throw new Error("Invalid status value");
    }

    const lead = await BuyLead.findById(req.params.id);

    if (!lead) {
        res.status(404);
        throw new Error("Buy lead not found");
    }

    lead.status = status;
    await lead.save();

    // Optionally: notify buyer about status update
    sendNotification(
        lead.buyerId.toString(),
        "Buy Lead Status Updated",
        `Your buy lead for ${lead.productName} is now ${status}`,
        "buyLead"
    );

    res.status(200).json({
        success: true,
        message: `Buy lead status updated to ${status}`,
        data: lead
    });
});
