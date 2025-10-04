
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

    const industry = await Industries.findOne({ slug, deleted: { $ne: true } })
        .populate({
            path: "categories",
            match: { deleted: { $ne: true } },
            select: "name slug industry subcategories",
            populate: {
                path: "subcategories",
                match: { deleted: { $ne: true } },
                select: "name slug category collections",
                populate: {
                    path: "collections",
                    match: { deleted: { $ne: true } },
                    select: "name slug subcategory"
                }
            }
        });

    if (!industry) {
        throw new ApiError(404, "Industry not found");
    }

    // Build hierarchical response
    const categories = industry.categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        parentIndustry: {
            _id: industry._id,
            name: industry.name,
            slug: industry.slug
        },
        subcategories: cat.subcategories.map(sub => ({
            _id: sub._id,
            name: sub.name,
            slug: sub.slug,
            parentCategory: {
                _id: cat._id,
                name: cat.name,
                slug: cat.slug
            },
            collections: sub.collections.map(col => ({
                _id: col._id,
                name: col.name,
                slug: col.slug,
                parentSubcategory: {
                    _id: sub._id,
                    name: sub.name,
                    slug: sub.slug
                }
            }))
        }))
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                industry: {
                    _id: industry._id,
                    name: industry.name,
                    slug: industry.slug
                },
                categories
            },
            "Collection fetched successfully"
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
    const { id } = req.params;

    try {
        const [industry] = await Industries.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                    deleted: { $ne: true },
                },
            },
            // Lookup categories
            {
                $lookup: {
                    from: "categories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "categories",
                },
            },
            {
                $addFields: {
                    categories: {
                        $filter: {
                            input: "$categories",
                            as: "category",
                            cond: { $eq: ["$$category.isDeleted", false] },
                        },
                    },
                },
            },
            // Lookup collections
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
            // Lookup subcategories of collections
            {
                $lookup: {
                    from: "subcategories",
                    localField: "collections.subcategory",
                    foreignField: "_id",
                    as: "subcategoryDetails",
                },
            },
            // Format collections (only selected fields)
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
            // Final projection
            {
                $project: {
                    _id: 1,
                    name: 1,
                    slug: 1,
                    heading: 1,
                    categories: 1,
                    collections: 1,
                },
            },
            { $limit: 1 },
        ]);

        if (!industry) {
            throw new ApiError(404, "Industry not found");
        }

        return res.status(200).json(
            new ApiResponse(200, industry, "Industry details with categories and collections fetched successfully")
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Something went wrong");
    }
});
