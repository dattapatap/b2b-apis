import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {FlashBanner} from "../../models/App/flashBanner.model.js";

export const getScreens = asyncHandler(async (req, res) => {
    const banners = await FlashBanner.find({isDeleted: false, status: "active"})
            .select("-isDeleted -createdAt -updatedAt -__v")
            .sort({ sr_no : 1 });
    return res.status(200).json(new ApiResponse(200, banners, "Flash screens fetched successfully"));
});
