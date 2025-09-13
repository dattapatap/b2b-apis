import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Industries} from "../../models/industries.modal.js";
import mongoose from "mongoose";



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
export const getIndustryDetails = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const industry = await Industries.findOne({"slug" : slug })
        .populate({
            path: "categories",
            match: { isDeleted: false },
            select: "-__v -isDeleted -createdAt -updatedAt", 
            populate: {
                path: "subcategories",
                match: { isDeleted: false },
                select: "-__v -isDeleted -createdAt -updatedAt", 
            },
        })
        .select("-isDeleted -createdAt -updatedAt -__v");

    if (!industry) {
        throw new ApiError(404, "Industry not found");
    }
    
    return res.status(200).json(new ApiResponse(200, industry, "Industry detail fetched successfully"));
});



export const getAllIndustryWithCollections = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try{
        const  [industry] = await Industries.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id), isDeleted: false } }, 
            {
                $lookup: {
                    from: "collections",
                    localField: "_id", 
                    foreignField: "industry",
                    as: "collections",
                },
            },   
            {
                $addFields: {
                    collections: {
                        $filter: {
                            input: "$collections",
                            as: "collection",
                            cond: { $eq: ["$$collection.isDeleted", false] },
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "subcategories", 
                    localField: "collections.subcategory", 
                    foreignField: "_id", 
                    as: "subcategoryDetails",
                },
            },
            {
                $addFields: {
                    collections: {
                        $map: {
                            input: "$collections",
                            as: "collection",
                            in: {
                                _id: "$$collection._id",
                                name: "$$collection.name",
                                image: "$$collection.image",
                                slug: "$$collection.slug",
                                heading: "$$collection.heading",                            
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    heading:1,
                    collections: 1,
                },
            },
            { $limit: 1 },
        ]);
        if (!industry) {
            throw new ApiError(404, "Industry not found");
        }   
    
        return res.status(200).json(new ApiResponse(200, industry, "Industry Details fetched successfully"));
    }catch(error){
        console.log(error);
    }
});
