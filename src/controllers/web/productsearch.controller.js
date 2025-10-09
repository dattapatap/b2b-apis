import Joi from "joi";
import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {Product} from "../../models/product.model.js";

export const searchProducts = asyncHandler(async (req, res) => {
    const {
        keyword,
        category,
        subcategory,
        city,
        industry,
        minPrice,
        maxPrice,
        status,
        location,
        minRating,
        specs,
        page = 1,
        limit = 10,
        sortBy,
    } = req.query;

    const SearchSchema = Joi.object({
        keyword: Joi.string().optional().allow(""),
        category: Joi.string().optional().allow(""),
        subcategory: Joi.string().optional().allow(""),
        minPrice: Joi.number().optional(),
        maxPrice: Joi.number().optional(),
        status: Joi.string().optional(),
        location: Joi.string().optional(),
        city: Joi.string().optional(),
        industry: Joi.string().optional(),
        minRating: Joi.number().optional(),
        specs: Joi.string().optional(),
        page: Joi.number().optional(),
        limit: Joi.number().optional(),
        sortBy: Joi.string().optional(),
    });

    try {
        await SearchSchema.validateAsync(req.query, {abortEarly: false});

        let query = {is_banned: "false"};

        if (keyword) query.$text = {$search: keyword};
        if (category) query.category = category;
        if (subcategory) query.subcategories = subcategory;
        if (city) query.city = city;
        if (industry) query.industry = industry;
        if (status) query.status = status;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (minRating) query.rating = {$gte: Number(minRating)};
        if (location) {
            pipeline.push({
                $lookup: {
                    from: "sellers",
                    localField: "seller_id",
                    foreignField: "_id",
                    as: "seller_info",
                },
            });
            pipeline.push({$match: {"seller_info.location": location}});
        }

        if (specs) {
            const specsArray = Array.isArray(specs) ? specs : JSON.parse(specs);
            query.$and = specsArray.map((s) => ({
                specifications: {$elemMatch: {spec_id: s.spec_id, value: s.value}},
            }));
        }

        let sortOptions = {};
        if (sortBy === "price_asc") sortOptions.price = 1;
        else if (sortBy === "price_desc") sortOptions.price = -1;
        else if (sortBy === "rating") sortOptions.rating = -1;
        else sortOptions.createdAt = -1;

        const skip = (Number(page) - 1) * Number(limit);

        const products = await Product.find(query)
            .select(
                "  -stages -status -additional_details -createdAt -updatedAt -__v -deleted -is_banned",
            )
            .populate("category subcategories seller_id product_unit media industry", "name slug  company_name ")
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit));

        const total = await Product.countDocuments(query);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    total,
                    page: Number(page),
                    totalPages: Math.ceil(total / limit),
                    data: products,
                },
                "Products fetched successfully",
            ),
        );
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    error.details.map((d) => d.message),
                ),
            );
        }
        return res.status(500).json(new ApiError(500, error.message));
    }
});
