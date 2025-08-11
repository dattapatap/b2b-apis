import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

import { findSubcategories } from '../../../utils/helper.js';
import { Product } from "../../../models/product.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../../../utils/cloudinary.js";

import Joi from "joi";
import { ProductMedia } from "../../../models/productMedia.model.js";
import slugify from "slugify";
import { Industries } from "../../../models/industries.modal.js";
import { Categories } from "../../../models/categories.model.js";
import { SubCategories } from "../../../models/subCategories.model.js";


export const getActiveProducts = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { seller_id: loggedInUser._id, status: 'active' };

    const products = await Product.find(filter)
        .populate({
            path: "subcategories",
            select: "name category",
            populate: {
                path: "category",
                model: "Categories",
                select: "name"
            }
        })
        .populate({
            path: "industry",
            select: "name"
        })
        .populate({
            path: "media",
            select: "type images"
        })
        .select("name slug price status subcategories media")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
       

    const productsList = products.map(product => {
        const imageMedia = product.media?.find(m => m.type === 'image');        
        const singleImage = imageMedia?.images?.original || null;

        const firstSubcat = product.subcategories?.[0];
        const categoryName = firstSubcat?.category?.name || null;
        const subcategoryName = firstSubcat?.name || null;

        return {
            id: product._id,
            name: product.name,
            category: categoryName,
            subcategory: subcategoryName,
            slug: product.slug,
            image: singleImage,
            price: product.price,
            status: product.status
        };
    });

    const total = await Product.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, {
        productsList,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }, "Active products fetched successfully."));
});


export const getInactiveProducts = asyncHandler(async (req, res) => {

    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { seller_id: loggedInUser._id, status: 'inactive' };

    const products = await Product.find(filter)
        .populate({
            path: "subcategories",
            select: "name category",
            populate: {
                path: "category",
                model: "Categories",
                select: "name"
            }
        })
        .populate({
            path: "industry",
            select: "name"
        })
        .populate({
            path: "media",
            select: "type images"
        })
        .select("name slug price status subcategories media")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
       

    const productsList = products.map(product => {
        const imageMedia = product.media?.find(m => m.type === 'image');        
        const singleImage = imageMedia?.images?.original || null;

        const firstSubcat = product.subcategories?.[0];
        const categoryName = firstSubcat?.category?.name || null;
        const subcategoryName = firstSubcat?.name || null;

        return {
            id: product._id,
            name: product.name,
            category: categoryName,
            subcategory: subcategoryName,
            slug: product.slug,
            image: singleImage,
            price: product.price,
            status: product.status
        };
    });

    const total = await Product.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, {
        productsList,
        pagination: { total, page,  limit, totalPages: Math.ceil(total / limit), }
    }, "Deactiveted products fetched successfully."));



});


export const getProductDetail = asyncHandler(async (req, res) => {
    const product_id = req.params.id;
    const loggedInUser = req.user;

    const product = await Product.findById(product_id)
                                .populate("media", "images type _id")
                                .populate("product_unit", "_id name description")
                                .populate("subcategories", "name slug heading image");

    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action.");
    }
    return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully."));

});





export const createProduct = asyncHandler(async (req, res) => {
    const { name, price, product_unit } = req.body;
    const productImages = req.files;
    const loggedInUser = req.user;

    // Validation Schema
    const schema = Joi.object({
        name: Joi.string().min(5).max(100).required().messages({
            "string.base": "Product name must be a string.",
            "string.empty": "Product name cannot be empty.",
            "string.min": "Product name should have at least 5 characters.",
            "string.max": "Product name should not exceed 100 characters.",
            "any.required": "Product name is a required field."
        }),
        price: Joi.number().required().messages({
            "number.base": "Price must be a number.",
            "number.empty": "Price cannot be empty.",
            "any.required": "Price is a required field."
        }),
        product_unit: Joi.string().required()
    });

    const imageSchema = Joi.array().items(
        Joi.object({
            originalname: Joi.string().regex(/\.(jpg|jpeg|png|webp)$/i).required().messages({
                "string.pattern.base": "Only image files (jpg, jpeg, png, webp) are allowed.",
                "any.required": "Image file name is required."
            }),
            size: Joi.number().max(2 * 1024 * 1024).required().messages({
                "number.max": "Each image file size should not exceed 2MB.",
                "any.required": "Image file size is required."
            }),
            mimetype: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp').required().messages({
                "any.only": "Invalid image type. Only JPEG, JPG, PNG, and WebP are allowed.",
                "any.required": "Image MIME type is required."
            })
        }).unknown(true)
    ).min(1).max(10).required().messages({
        "array.min": "At least 1 image is required.",
        "array.max": "Maximum 10 images are allowed.",
        "any.required": "Product images are required."
    });

    // Validate basic fields
    await schema.validateAsync({ name, price, product_unit }, { abortEarly: false });
    
    // Validate images if provided
    if (productImages && productImages.length > 0) {
        await imageSchema.validateAsync(productImages, { abortEarly: false });
    } else {
        throw new ApiError(400, "At least one product image is required.");
    }

    const slug = slugify(name, { lower: true }) + "-" + Date.now();
    const productData = { 
        name: name, 
        seller_id: loggedInUser._id,  
        slug: slug, 
        price: price,
        product_unit: product_unit,
        stages: {
            basic_info: true,
            media: true,
            category: false,
            specifications: false,
            additional_details: false,
            review: false
        }
    };

    const newProduct = new Product(productData);
    await newProduct.save();

    // Upload images to Cloudinary and create media records
    const uploadedMediaIds = [];
    
    for (const imageFile of productImages) {
        try {
            const uploadedUrl = await uploadOnCloudinary(imageFile.path, "product-gallery");
            const transformations = {
                "100x100": uploadedUrl.replace("/upload/", "/upload/w_100,h_100,c_fill/"),
                "250x250": uploadedUrl.replace("/upload/", "/upload/w_250,h_250,c_fill/"),
                "500x500": uploadedUrl.replace("/upload/", "/upload/w_500,h_500,c_fill/"),
                "1000x1000": uploadedUrl.replace("/upload/", "/upload/w_1000,h_1000,c_fill/")
            };

            // Create media record
            const mediaData = new ProductMedia({
                product_id: newProduct._id,
                type: "image",
                images: {
                    original: uploadedUrl,
                    sizes: transformations
                },
                metadata: {
                    size_in_kb: imageFile.size / 1024,
                    format: imageFile.mimetype
                }
            });

            await mediaData.save();
            uploadedMediaIds.push(mediaData._id);
        } catch (error) {
            console.error(`Failed to upload image ${imageFile.originalname}:`, error);
        }
    }

    // Update product with media IDs
    if (uploadedMediaIds.length > 0) {
        newProduct.media = uploadedMediaIds;
        await newProduct.save();
    }

    // Fetch the complete product with populated fields
    const populatedProduct = await Product.findById(newProduct._id)
        .populate("media", "images type _id")
        .populate("product_unit", "_id name description")
        .populate("subcategories", "name slug heading image");

    return res.status(201).json(new ApiResponse(201, populatedProduct, "Product with images added successfully"));
});

export const addSubCategoriesToProduct = asyncHandler(async (req, res) => {
    const { productId,  industry, category, subcategory_ids } = req.body;
    const loggedInUser = req.user;

    const schema = Joi.object({
        productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.pattern.base": "Invalid product ID format.",
            "any.required": "Product ID is required."
        }),
        industry: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.pattern.base": "Invalid industry ID format."
        }),
        category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.pattern.base": "Invalid category ID format."
        }),
        subcategory_ids: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).min(1)
        .required()
        .messages({
            "string.pattern.base": "Invalid subcategory ID format.",
            "array.min": "At least one subcategory is required.",
            "any.required": "Subcategories are required."
        }),
    });

    await schema.validateAsync( { productId , industry, category, subcategory_ids },   { abortEarly: false });

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found.");
    }

    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action");
    }


    const matchIndustry = await Industries.findById(industry);
    if (!matchIndustry) {
        throw new ApiError(404, "Industry id provided wrong.");
    }

    const matchCategory = await Categories.findById(category);
    if (!matchCategory) {
        throw new ApiError(404, "Category id provided wrong.");
    }

 
    // Check if all subcategories exist
    const finalSubcategories = await SubCategories.find({ _id: { $in: subcategory_ids } });
    if (finalSubcategories.length !== subcategory_ids.length) {
        throw new ApiError(400, "One or more subcategories do not exist.");
    }

    // Update industry, category, and subcategories
    product.industry = industry;
    product.category = category;
    product.subcategories = finalSubcategories.map(sub => sub._id);

    // Update stage
    if (product.stages) {
        product.stages.category = true;
    }
    await product.save();

    const populatedProduct = await Product.findById(product._id)
                .populate("media", "images type _id")
                .populate("product_unit", "_id name description")
                .populate("subcategories", "name slug heading image");

                    
    return res.status(200).json(new ApiResponse(200, populatedProduct, "Subcategories added successfully."));
});






export const addProductDescription = asyncHandler( async( req, res) => {
    const product_id = req.body.productId;
    const product_type = req.body.product_type;
    const product_description = req.body.product_description;

    const loggedInUser = req.user;

    const schema = Joi.object({
        product_type: Joi.string().required(),
        product_description: Joi.string().required(),
    });
    await schema.validateAsync({ product_type, product_description }, { abortEarly: false });

    const product = await Product.findById(product_id).populate('product_unit')

    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action.");
    }

    product.product_type = product_type;
    product.description = product_description;
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate("media", "url type metadata")
    .populate("subcategories", "name slug heading image ")
    .populate("");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product description added successfully."));

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
        product_id: product._id,
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
    const existingVideo = await ProductMedia.findOne({ product_id: productId, type: "video" });

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

    const product = await Product.findById(productId).populate("media");;
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

});

// Get suggested subcategories for a product name
export const getSuggestedSubcategories = asyncHandler(async (req, res) => {
    const { product_name } = req.body;
    
    if (!product_name || product_name.trim().length < 3) {
        throw new ApiError(400, "Product name must be at least 3 characters long.");
    }
    
    const suggestions = await findSubcategories(product_name);
    
    return res.status(200).json(new ApiResponse(200, {
        suggestions,
        count: suggestions.length,
        product_name
    }, "Subcategory suggestions fetched successfully."));
});

// Get categories by industry
export const getCategoriesByIndustry = asyncHandler(async (req, res) => {
    const { industry_id } = req.params;
    
    const Categories = (await import("../../../models/categories.model.js")).Categories;
    
    const categories = await Categories.find({ 
        industry: industry_id, 
        isDeleted: false 
    }).select("name _id slug image");
    
    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully."));
});

// Get subcategories by category
export const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
    const { category_id } = req.params;    
    const subcategories = await SubCategories.find({ 
        category: category_id, 
        isDeleted: false 
    }).select("name _id slug heading image");
    
    return res.status(200).json(new ApiResponse(200, subcategories, "Subcategories fetched successfully."));
});

