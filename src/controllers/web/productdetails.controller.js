import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { Product } from "../../models/product.model.js";

import Joi from "joi";
import mongoose from "mongoose";
import { ProductMedia } from "../../models/productMedia.model.js";



export const getProductDetail = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const loggedInUser = req.user;

    const product = await Product.findOne({ slug })
                                .populate("media", "images url type metadata")
                                .populate("subcategories", "name slug heading image");

    if (!product) throw new ApiError(404, "Product not found.");

    return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully."));

});
