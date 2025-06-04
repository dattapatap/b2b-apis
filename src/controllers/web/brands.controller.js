import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import { Brands } from "../../models/brands.model.js";

export const getAllBrands = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const brands = await Brands.find({ isDeleted: false }).skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const totalBrands = await Brands.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);

    return res.status(200).json(
        new ApiResponse( 200, { 
                brands,
                pagination: { currentPage: page, totalPages, totalBrands, limit },
            }, "Brands fetched successfully", ),
    );
    
});


export const getBrandById = asyncHandler(async (req, res) => { 
    const {id} = req.params;
    const brand = await Brands.findById(id).select("-isDeleted -createdAt -updatedAt -__v");;
    if (!brand) {
        return res.status(400).json(new ApiError(400, null, "Brand not found"));
    }
    return res.status(200).json(new ApiResponse(200, brand, "Brand fetched successfully"));
});
