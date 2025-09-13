import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import { Collections } from "../../models/collections.model.js";


const allowedExtensions = [".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;


export const getAllCollections = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const collection = await Collections.find({ isDeleted: false }).populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const totalCollection = await Collections.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalCollection / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
            collection,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCollection,
                    limit,
                },
            },
            "Collection fetched successfully",
        ),
    );
    
});


// Get a Category by ID
export const getCollectionById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const collection = await Collections.findById(id)
                            .populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            .populate("subcategory", '-__v -isDeleted -createdAt -updatedAt')
                            .select("-isDeleted -createdAt -updatedAt -__v");
    if (!collection) {
        return res.status(400).json(new ApiError(400, null, "Collection not found"));
    }
    return res.status(200).json(new ApiResponse(200, collection, "Collection fetched successfully"));
});
