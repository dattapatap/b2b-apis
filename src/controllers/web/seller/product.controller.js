import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

import { findSubcategories } from '../../../utils/helper.js';
import { Product } from "../../../models/product.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../../../utils/cloudinary.js";

import Joi from "joi";
import mongoose from "mongoose";
import { ProductMedia } from "../../../models/productMedia.model.js";


export const getActiveProducts = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller_id: loggedInUser._id, status: "active" })
        .populate("media", "images url type metadata")
        .populate("subcategories", "name slug heading image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments({
        seller_id: loggedInUser._id,
        status: "active"
    });

    return res.status(200).json(new ApiResponse(200, { 
            products, 
            pagination: { total,  page, limit, totalPages: Math.ceil(total / limit), }
        }, "Active products fetched successfully."));

});


export const getInactiveProducts = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "Unauthorized access.");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
        seller_id: loggedInUser._id,
        status: "inactive"
    })
        .populate("media", "images url type metadata")
        .populate("subcategories", "name slug heading image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments({
        seller_id: loggedInUser._id,
        status: "inactive"
    });

    return res.status(200).json(new ApiResponse(200, {
        products,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }, "Inactive products fetched successfully."));
});




export const getProductDetail = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const loggedInUser = req.user;

    const product = await Product.findOne({ slug })
                                .populate("media", "images url type metadata")
                                .populate("subcategories", "name slug heading image");

    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action.");
    }
    return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully."));

});


export const createProduct = asyncHandler(async (req, res) => {
    const { product_name } = req.body;
    const loggedInUser = req.user;

    if (!loggedInUser) {
       throw new ApiError(401, "Unauthorized access." );
    }

    const schema = Joi.object({
        product_name: Joi.string().min(3).max(100).required().messages({
            "string.base": "Product name must be a string.",
            "string.empty": "Product name cannot be empty.",
            "string.min": "Product name should have at least 3 characters.",
            "string.max": "Product name should not exceed 100 characters.",
            "any.required": "Product name is a required field."
        }),
    });
    await schema.validateAsync({ product_name }, { abortEarly: false });

    const matchedSubcategories = await findSubcategories(product_name);

    if (!matchedSubcategories || matchedSubcategories.length === 0) {
        throw new ApiError(400, "No matching subcategory found for the product name. please contact to the administator");
    }

    // Prepare Product Data
    const productData = {
        name: product_name,
        seller_id : loggedInUser._id,
        // slug : 
    };

    // Single Subcategory - Assign to Product
    if (matchedSubcategories.length === 1) {
        productData.subcategory = matchedSubcategories[0]._id;
    }

    const newProduct = new Product(productData);
    await newProduct.save();

    return res.status(201).json(new ApiResponse(201, newProduct, "Product created successfully"));
});


export const addCategoriesToProduct = asyncHandler(async (req, res) => {
    const { productId, categories } = req.body;
    const loggedInUser = req.user;

    const schema = Joi.object({
        productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.pattern.base": "Invalid product ID format.",
            "any.required": "Product ID is required."
        }),
        categories: Joi.array().items(Joi.string()).min(1).unique().required().messages({
            "array.base": "Categories must be an array.",
            "any.required": "Categories are required."
        })
    });

    await schema.validateAsync(req.body, { abortEarly: false });

    const validCategories = categories.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validCategories.length === 0) {
        throw new ApiError(422, "No valid subcategory IDs provided.");
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found.");
    }

    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }

    const uniqueSubcategories = [...new Set([...product.subcategories.map(id => id.toString()), ...validCategories])];

    product.subcategories = uniqueSubcategories;
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate("media", "url type metadata")
                                                .populate("subcategories", "name slug heading image ");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Categories added successfully."));

});


export const addMedia = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const productFile = req.file;
    const loggedInUser = req.user;

    // Validation Schema
    const schema = Joi.object({
        productId: Joi.string().required(),
        file: Joi.object({
            originalname: Joi.string().regex(/\.(jpg|jpeg|png|webp)$/i).required().messages({
                "string.pattern.base": "Only image files are allowed.",
                "any.required": "File name is required."
            }),
            size: Joi.number().max(2 * 1024 * 1024).messages({
                "number.max": "File size should not exceed 2MB."
            })
        }).required().unknown(true)
    });
    await schema.validateAsync({ productId, file: productFile }, { abortEarly: false });

    const product = await Product.findById(productId).populate("media");
    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action.");
    }

    // Upload file to Cloudinary
    const uploadedUrl = await uploadOnCloudinary(productFile.path, "product-gallery");

    let mediaData;
    const transformations = {
        "100x100": uploadedUrl.replace("/upload/", "/upload/w_100,h_100,c_fill/"),
        "250x250": uploadedUrl.replace("/upload/", "/upload/w_250,h_250,c_fill/"),
        "500x500": uploadedUrl.replace("/upload/", "/upload/w_500,h_500,c_fill/"),
        "1000x1000": uploadedUrl.replace("/upload/", "/upload/w_1000,h_1000,c_fill/")
    };

    mediaData = new ProductMedia({
        slug: product._id,
        type: "image",
        images: {
            original: uploadedUrl,
            sizes: transformations
        },
        metadata: {
            size_in_kb: productFile.size / 1024,
            format: productFile.mimetype
        }
    });

    await mediaData.save();
    product.media.push(mediaData._id);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
                                    .populate("media", "images url type metadata")
                                    .populate("subcategories", "name slug heading image");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product media added successfully."));
    
});


export const addVideoUrl = asyncHandler(async (req, res) => {
    const { productId, videoUrl } = req.body;
    const loggedInUser = req.user;
    
    const schema = Joi.object({
        productId: Joi.string().required(),
        videoUrl: Joi.string()
            .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*$/)
            .required()
            .messages({
                "string.pattern.base": "Invalid YouTube URL.",
                "any.required": "Video URL is required."
            })
    });
    await schema.validateAsync({ productId, videoUrl }, { abortEarly: false });

    const product = await Product.findById(productId).populate("media");
    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action.");
    }

    // Check for existing video
    const existingVideo = await ProductMedia.findOne({ slug: productId, type: "video" });

    if (existingVideo) {
        existingVideo.url = videoUrl;
        await existingVideo.save();
    } else {
        const newVideo = new ProductMedia({
            product_id: productId,
            type: "video",
            url: videoUrl
        });
        await newVideo.save();

        product.media.push(newVideo._id);
        await product.save();
    }

    const populatedProduct = await Product.findById(product._id)
                        .populate("media", "images url type metadata")
                        .populate("subcategories", "name slug heading image");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "YouTube video added successfully."));
});


export const addProductCatlog = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const productyFile = req.file;
    const loggedInUser = req.user;

    const schema = Joi.object({
        productId: Joi.string().required(),
        file: Joi.object({
            originalname: Joi.string().regex(/\.pdf$/i).required().messages({
                "string.pattern.base": "Only PDF files are allowed.",
                "any.required": "PDF file name is required."
            }),
            size: Joi.number().max(5 * 1024 * 1024).messages({ 
                "number.max": "PDF file size should not exceed 5MB."
            })
        })
        .required()
        .unknown(true)
        .messages({
            "any.required": "Product Catalog PDF file is required."
        })
    });
    await schema.validateAsync({ productId, file: productyFile }, { abortEarly: false });

    const product = await Product.findById(productId).populate("media");
    if (!product) {
        throw new ApiError(404, "Product not found.");
    }
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }


    // check is exist
    const existingPdf = product.media.find(mediaItem => mediaItem.type === "pdf");
    if (existingPdf) {
        await deleteFromCloudinary(existingPdf.url); 
        await ProductMedia.findByIdAndDelete(existingPdf._id);
        product.media.pull(existingPdf._id);
    }


    const catalogUrl = await uploadOnCloudinary(productyFile.path, "product-catlogs");

    const media = new ProductMedia({
        product_id: product._id, 
        type: "pdf", 
        url: catalogUrl,
        metadata: { size_in_kb: req.file.size / 1024, format: "pdf", },
    });

    await media.save();

    product.media.push(media._id);
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate("media", "url type metadata")
                                                .populate("subcategories", "name slug heading image ");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product catalog added successfully."));
})


export const changeProductStatus = asyncHandler(async (req, res) =>{
    const { productId } = req.body;
    const loggedInUser = req.user;

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found.");
    }
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }


    product.status = (product.status == 'active')?'inactive':'active';
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate("media", "url type metadata")
                                                .populate("subcategories", "name slug heading image ");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product status changed."));

})


