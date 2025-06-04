import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Industries} from "../../models/industries.modal.js";



export const getAllIndustry = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const industry = await Industries.find({isDeleted: false})
        .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    console.log(industry);

    const totalIndustry = await Industries.find({isDeleted: false}).countDocuments();
    const totalPages = Math.ceil(totalIndustry / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                industry,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalIndustry,
                    limit,
                },
            },
            "Industry fetched successfully",
        ),
    );
});


// Get a Industry by ID
export const getIndustryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const industry = await Industries.findById(id)
                        .populate({
                            path: "categories",
                            select: "-__v -isDeleted -createdAt -updatedAt", 
                        })
                        .select("-isDeleted -createdAt -updatedAt -__v");
    if (!industry) {
        throw new ApiError(404, "Industry not found");
    }

    return res.status(200).json(new ApiResponse(200, industry, "Industry fetched successfully"));
});

