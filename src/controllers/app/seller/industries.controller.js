import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import {Industries} from "../../../models/industries.modal.js";

export const getAllIndustry = asyncHandler(async (req, res) => {
    const industry = await Industries.find({  deleted: { $ne:true }  })
                .select("-createdAt -updatedAt -__v -deleted -sr_no")
                .sort( { sr_no : 1});
    return res.status(200).json( new ApiResponse( 200, industry, "Industry fetched successfully"));
});

// Get a Industry by ID
export const getIndustryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const industry = await Industries.findById(id).select("-createdAt -updatedAt");
    if (!industry) {
        throw new ApiError(404, "Industry not found");
    }

    return res.status(200).json(new ApiResponse(200, industry, "Industry fetched successfully"));
});
