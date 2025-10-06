
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { Industries } from "../../models/industries.modal.js";

export const getAllIndustry = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const industry = await Industries.find({ deleted: { $ne: true } })
        .skip(skip)
        .limit(limit)
        .select(" -createdAt -updatedAt -__v");

    const totalIndustry = await Industries.countDocuments({ deleted: { $ne: true } });
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
            "Industries fetched successfully"
        )
    );
});

export const getCollectionByIndustry = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const industry = await Industries.aggregate([
        { $match: { slug, deleted: { $ne: true } } },

        // lookup categories
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "industry",
                as: "categories",
                pipeline: [
                    { $match: { deleted: { $ne: true } } },

                    // lookup subcategories
                    {
                        $lookup: {
                            from: "subcategories",
                            localField: "_id",
                            foreignField: "category",
                            as: "subcategories",
                            pipeline: [
                                { $match: { deleted: { $ne: true } } },

                            ]
                        }
                    },
                    { $project: { name: 1, slug: 1, subcategories: 1 } }
                ]
            }
        },
        { $project: { name: 1, slug: 1, categories: 1 } }
    ]);

    if (!industry.length) {
        throw new ApiError(404, "Industry not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                industry: industry[0],
            },
            "Categories fetched successfully"
        )
    );
});


export const getIndustryDetails = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const industry = await Industries.findOne({ slug, deleted: { $ne: true } })
        .populate({
            path: "categories",
            match: { deleted: { $ne: true } },
            select: "-__v -isDeleted -createdAt -updatedAt",
            populate: {
                path: "subcategories",
                match: {deleted: { $ne: true } },
                select: "-__v -isDeleted -createdAt -updatedAt",
            },
        })
        .select("-isDeleted -createdAt -updatedAt -__v");

    if (!industry) {
        throw new ApiError(404, "Industry not found");
    }

    return res.status(200).json(
        new ApiResponse(200, industry, "Industry details fetched successfully")
    );
});

export const getAllIndustryWithCollections = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const industry = await Industries.aggregate([
        { $match: { slug, deleted: { $ne: true } } },

        // lookup categories
        {
            $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "industry",
                as: "categories",
                pipeline: [
                    { $match: { deleted: { $ne: true } } },

                    // lookup subcategories
                    {
                        $lookup: {
                            from: "subcategories",
                            localField: "_id",
                            foreignField: "category",
                            as: "subcategories",
                            pipeline: [
                                { $match: { deleted: { $ne: true } } },

                                // lookup collections
                                {
                                    $lookup: {
                                        from: "collections",
                                        localField: "_id",
                                        foreignField: "subcategory",
                                        as: "collections",
                                        pipeline: [
                                            { $match: { deleted: { $ne: true } } },
                                            { $project: { name: 1, slug: 1,image:1 } }
                                        ]
                                    }
                                },
                                { $project: { name: 1, slug: 1, collections: 1 } }
                            ]
                        }
                    },
                    { $project: { name: 1, slug: 1, subcategories: 1 ,image:1} }
                ]
            }
        },
        { $project: { name: 1, slug: 1, categories: 1, } }
    ]);

    if (!industry.length) {
        throw new ApiError(404, "Industry not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                industry: industry[0],
            },
            "Categories fetched successfully"
        )
    );
});
