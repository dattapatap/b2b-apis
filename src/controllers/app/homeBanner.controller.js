import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {AppBanners } from "../../models/App/appBanners.model.js";

export const getBanners = asyncHandler(async (req, res) => {
    const banners = await AppBanners.find({isDeleted: false, status: "active"})
            .select("-isDeleted -createdAt -updatedAt -__v")
            .sort({ sr_no : 1 });
    return res.status(200).json(new ApiResponse(200, banners, "Banners fetched successfully"));
});
