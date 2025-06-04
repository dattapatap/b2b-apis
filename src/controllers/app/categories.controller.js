import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Categories} from "../../models/categories.model.js";

export const getAllCategory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const categories = await Categories.find({isDeleted: false})
        .skip(skip)
        .limit(limit)
        .select("-isDeleted -createdAt -updatedAt -__v -industry");

    const tatalCategories = await Categories.find({isDeleted: false}).countDocuments();
    const totalPages = Math.ceil(tatalCategories / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                categories,
                pagination: {
                    currentPage: page,
                    totalPages,
                    tatalCategories,
                    limit,
                },
            },
            "Category fetched successfully",
        ),
    );
});

// Get a Industry by ID
export const getCategoryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const industry = await Categories.findById(id)
                .populate('subcategories', '-isDeleted -createdAt -updatedAt -__v')
                // .populate("industry", "-__v -isDeleted -createdAt -updatedAt")
                .select("-isDeleted -createdAt -updatedAt -__v");
    if (!industry) {
        return res.status(400).json(new ApiError(400, null, "Categories not found"));
    }

    return res.status(200).json(new ApiResponse(200, industry, "Industry fetched successfully"));
});
