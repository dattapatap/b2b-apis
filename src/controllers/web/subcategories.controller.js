import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import { SubCategories} from "../../models/subCategories.model.js";

export const getAllSubCategory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const sub_categories = await SubCategories.find({isDeleted: false})
        .skip(skip)
        .limit(limit)
        .select("-isDeleted -createdAt -updatedAt -__v");

    const tatalSubCategories = await SubCategories.find({isDeleted: false}).countDocuments();
    const totalPages = Math.ceil(tatalSubCategories / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                sub_categories,
                pagination: {
                    currentPage: page,
                    totalPages,
                    tatalSubCategories,
                    limit,
                },
            },
            "Sub Category fetched successfully",
        ),
    );
});

// Get a Industry by ID
export const getSubCategoryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const sindustry = await SubCategories.findById(id)
        .populate("industry", "-__v -isDeleted -createdAt -updatedAt")
        .select("-isDeleted -createdAt -updatedAt -__v");
    if (!sindustry) {
        return res.status(400).json(new ApiError(400, null, "Sub Categories not found"));
    }

    return res.status(200).json(new ApiResponse(200, sindustry, "Sub Industry fetched successfully"));
});
