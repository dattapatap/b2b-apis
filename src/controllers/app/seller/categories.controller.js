import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import {Categories} from "../../../models/categories.model.js";

export const getAllCategories = asyncHandler(async (req, res) => {
    const category = await Categories.find({deleted: {$ne: true}})
        .select("-createdAt -updatedAt -__v -deleted -sr_no")
        .sort({sr_no: 1});
    return res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));
});

// Get a Industry by ID
export const getCategoryById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const category = await Categories.findById(id).select("-createdAt -updatedAt -__v -deleted -sr_no");
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));
});

// Get a category by industry ID
export const getCategoryByIndustryId = asyncHandler(async (req, res) => {
    const {industry} = req.params;

    const categories = await Categories.find({industry : industry, deleted : { $ne : true} }).select("-createdAt -updatedAt -__v -deleted -sr_no");
    if (!industry) {
        throw new ApiError(404, "Categories not found");
    }

    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
});
