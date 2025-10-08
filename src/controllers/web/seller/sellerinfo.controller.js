import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { User } from "../../../models/user.model.js";

export const getSellerDetail = asyncHandler(async (req, res) => {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId)
        .populate("personal_details")
        .populate("contacts")
        .populate("business_card")
        .populate("business_details");

    if (!seller) throw new ApiError(404, "Seller not found");

    // Build sellerInfo like your product API
    const sellerInfo = {
        companyName: seller.personal_details?.company_name || "",
        logo: seller.personal_details?.company_logo || "",
        location: seller.contacts?.[0]?.address?.city || "",
        gst: seller.business_details?.gstin || "",
        yearsCompleted: seller.verifiedYears || 10,
        review: seller.rating || { stars: 5, count: 4 },
        mobile: seller.personal_details?.primary_mobile || "",
        contactSupplier: seller.contacts?.[0]?.email || "",
    };

    return res.status(200).json(new ApiResponse(200, sellerInfo, "Seller details fetched successfully."));
});
