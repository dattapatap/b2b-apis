import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Categories} from "../../models/categories.model.js";
import mongoose from "mongoose";
import { populate } from "dotenv";

export const getAllCategory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const categories = await Categories.find({deleted: {$ne: true}})
        .skip(skip)
        .limit(limit)
        .select("-isDeleted -createdAt -updatedAt -__v -industry");

    const tatalCategories = await Categories.find({deleted: {$ne: true}}).countDocuments();
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
export const getCategoryDetails = asyncHandler(async (req, res) => {
    const {slug} = req.params;
    let category = [];

    if (mongoose.Types.ObjectId.isValid(slug)) {
        category = await Categories.findById(id)
                .populate({
                    path: "subcategories",
                    match:  {deleted: {$ne: true}} ,
                    select: "-__v -isDeleted -createdAt -updatedAt", 
                    populate: {
                        path: "collections",
                        match: { isDeleted: false },
                        select: "-__v -isDeleted -createdAt -updatedAt", 
                    },
                    
                })
                .select("-isDeleted -createdAt -updatedAt -__v");
    } else {
        category = await Categories.findOne({ slug: slug })
                    .populate('industry',  'name slug heading image')
                    .populate({
                        path: "subcategories",
                        match: {deleted: {$ne: true}},
                        select: "-__v -isDeleted -createdAt -updatedAt", 
                        populate: {
                            path: "collections",
                            match:{deleted: {$ne: true}},
                            select: "-__v -isDeleted -createdAt -updatedAt", 
                        },
                    })
                    .select("-isDeleted -createdAt -updatedAt -__v");
    }

    if (!category) {
        return res.status(400).json(new ApiError(400, null, "Categories not found"));
    }
    return res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));

});

