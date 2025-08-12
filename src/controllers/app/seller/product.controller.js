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
    const productId = req.params.id;
    const loggedInUser = req.user;

    const product = await Product.findById(productId)
                                .populate("media", "images type _id").populate("category", "name slug heading _id")
                                .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                                .populate("subcategories", "name slug heading image")
                                .populate("specifications.spec_id", "spec_id inputType options")
                                .populate("additional_details.additional_id", "name inputType options");

    if (!product) throw new ApiError(404, "Product not found.");

    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action.");
    }

    return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully."));

});

export const createProduct = asyncHandler(async (req, res) => {
    const { name, price } = req.body;
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
        })
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
    await schema.validateAsync({ name, price }, { abortEarly: false });
    
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
                                .populate("media", "images type _id").populate("category", "name slug heading _id")
                                .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                                .populate("subcategories", "name slug heading image")
                                .populate("specifications.spec_id", "spec_id inputType options")
                                .populate("additional_details.additional_id", "name inputType options");

    return res.status(201).json(new ApiResponse(201, populatedProduct, "Product with images added successfully"));

});


export const updateProduct = asyncHandler(async (req, res) => {
    const { productId, name, price } = req.body;
    const loggedInUser = req.user;
    // Joi Schema for validation
    const schema = Joi.object({
        productId: Joi.string().required().messages({
            "any.required": "Product ID is required."
        }),
        name: Joi.string().min(5).max(100).optional().messages({
            "string.base": "Product name must be a string.",
            "string.min": "Product name should have at least 5 characters.",
            "string.max": "Product name should not exceed 100 characters."
        }),
        price: Joi.number().optional().messages({
            "number.base": "Price must be a number."
        })
    });

    // Validate fields
    await schema.validateAsync({ productId, name, price }, { abortEarly: false });

   // Find product
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found.");

    // Check ownership
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(403, "Unauthorized action. This product does not belong to you.");
    }

    // Update fields if provided
    if (name) {
        product.name = name;
        product.slug = slugify(name, { lower: true }) + "-" + Date.now();
    }
    if (price !== undefined) {
        product.price = price;
    }

    await product.save();

    // Fetch updated product
    const populatedProduct = await Product.findById(product._id)
                    .populate("media", "images type _id").populate("category", "name slug heading _id")
                    .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                    .populate("subcategories", "name slug heading image")
                    .populate("specifications.spec_id", "spec_id inputType options")
                    .populate("additional_details.additional_id", "name inputType options");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product updated successfully"));
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

    product.subcategories = subcategory_ids;

    // Update stage
    if (product.stages) {
        product.stages.categories = true;
    }
    await product.save();

    const populatedProduct = await Product.findById(product._id)
                        .populate("media", "images type _id").populate("category", "name slug heading _id")
                        .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                        .populate("subcategories", "name slug heading image")
                        .populate("specifications.spec_id", "spec_id inputType options")
                        .populate("additional_details.additional_id", "name inputType options");

                    
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

    const product = await Product.findById(product_id);

    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(400, "Unauthorized action. This product is not belongs to you!");
    }

    product.product_type = product_type;
    product.description = product_description;

    if (product.stages) {
        product.stages.descriptions = true;
    }

    await product.save();

    const populatedProduct = await Product.findById(product._id)
                        .populate("media", "images type _id").populate("category", "name slug heading _id")
                        .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                        .populate("subcategories", "name slug heading image")
                        .populate("specifications.spec_id", "spec_id inputType options")
                        .populate("additional_details.additional_id", "name inputType options");

    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product description added successfully."));

});

export const addMedia = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const productFiles = req.files;
    const loggedInUser = req.user;

    // Validation Schema
    const schema = Joi.object({
        productId: Joi.string().required(),
        medias: Joi.array().items(
            Joi.object({
                originalname: Joi.string().regex(/\.(jpg|jpeg|png|webp)$/i).required().messages({
                    "string.pattern.base": "Only image files (jpg, jpeg, png, webp) are allowed.",
                    "any.required": "File name is required."
                }),
                size: Joi.number().max(2 * 1024 * 1024).required().messages({
                    "number.max": "Each file size should not exceed 2MB.",
                    "any.required": "File size is required."
                }),
                mimetype: Joi.string().valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp').required().messages({
                    "any.only": "Invalid image type. Only JPEG, JPG, PNG, and WebP are allowed.",
                    "any.required": "File MIME type is required."
                })
            }).unknown(true)
        ).min(1).max(5).required().messages({
            "array.min": "At least 1 image is required.",
            "array.max": "Maximum 10 images are allowed.",
            "any.required": "Product images are required."
        })
    });

    await schema.validateAsync({ productId, medias: productFiles }, { abortEarly: false });

    const product = await Product.findById(productId).populate("media");
    if (!product) throw new ApiError(404, "Product not found.");
    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(404, "Unauthorized action. This product not belongs to you!");
    }


    const uploadedMediaIds = [];
    // Upload file to Cloudinary
    for (const file of productFiles) {
        try {
            const uploadedUrl = await uploadOnCloudinary(file.path, "product-gallery");

            const transformations = {
                "100x100": uploadedUrl.replace("/upload/", "/upload/w_100,h_100,c_fill/"),
                "250x250": uploadedUrl.replace("/upload/", "/upload/w_250,h_250,c_fill/"),
                "500x500": uploadedUrl.replace("/upload/", "/upload/w_500,h_500,c_fill/"),
                "1000x1000": uploadedUrl.replace("/upload/", "/upload/w_1000,h_1000,c_fill/")
            };

            // Create media record
            const mediaData = new ProductMedia({
                product_id: product._id,
                type: "image",
                images: {
                    original: uploadedUrl,
                    sizes: transformations
                },
                metadata: {
                    size_in_kb: file.size / 1024,
                    format: file.mimetype
                }
            });

            await mediaData.save();
            uploadedMediaIds.push(mediaData._id);

        } catch (err) {
            console.error(`Error uploading ${file.originalname}:`, err);
        }
    }

    if (uploadedMediaIds.length > 0) {
        product.media.push(...uploadedMediaIds);
        if (product.stages) {
            product.stages.media = true;
        }
        await product.save();
    }

    const populatedProduct = await Product.findById(product._id)
                    .populate("media", "images type _id").populate("category", "name slug heading _id")
                    .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                    .populate("subcategories", "name slug heading image")
                    .populate("specifications.spec_id", "spec_id inputType options")
                    .populate("additional_details.additional_id", "name inputType options");

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
        throw new ApiError(400, "Unauthorized action. This product not belongs to you!");
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
                .populate("media", "images type _id").populate("category", "name slug heading _id")
                .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                .populate("subcategories", "name slug heading image")
                .populate("specifications.spec_id", "spec_id inputType options")
                .populate("additional_details.additional_id", "name inputType options");


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

    if (product.stages) {
        product.stages.media = true;
    }
    await product.save();

    const populatedProduct = await Product.findById(product._id)
                .populate("media", "images type _id").populate("category", "name slug heading _id")
                .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                .populate("subcategories", "name slug heading image")
                .populate("specifications.spec_id", "spec_id inputType options")
                .populate("additional_details.additional_id", "name inputType options");
                                    

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

    const populatedProduct = await Product.findById(product._id)
                            .populate("media", "images type _id").populate("category", "name slug heading _id")
                            .populate("industry", "name slug heading id").populate("product_unit", "_id name description")
                            .populate("subcategories", "name slug heading image")
                            .populate("specifications.spec_id", "spec_id inputType options")
                            .populate("additional_details.additional_id", "name inputType options");


    return res.status(200).json(new ApiResponse(200, populatedProduct, "Product status changed."));

});


export const addProductSpecifications = asyncHandler ( async(req, resp) =>{

    const product_id = req.body.productId;
    const specifications = req.body.specifications;
    const loggedInUser = req.user;

    const schema = Joi.object({
        productId: Joi.string().required(),
        specifications: Joi.array().items(
            Joi.object({
                spec_id: Joi.string().required(),
                value: Joi.alternatives().try(
                    Joi.string(),
                    Joi.array().items(Joi.string())
                ).required()
            })
        ).required()
    });

    await schema.validateAsync({ productId: product_id, specifications }, { abortEarly: false });

    const product = await Product.findById(product_id);
    if (!product) throw new ApiError(404, "Product not found.");

    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(400, "Unauthorized action. This product does not belong to you!");
    }

    const incomingSpecIds = specifications.filter(s => s.spec_id).map(s => s.spec_id.toString());
    product.specifications = product.specifications.filter(existing => {
            return incomingSpecIds.includes(existing.spec_id.toString());      
    });


    specifications.forEach(spec => {
        const existingIndex = product.specifications.findIndex(
            s => s.spec_id?.toString() === spec.spec_id
        );
        if (existingIndex > -1) {
            product.specifications[existingIndex].value = spec.value;
        } else {
            product.specifications.push({ spec_id: spec.spec_id, value: spec.value });
        }
    });


    if (product.stages) {
        product.stages.specifications = true;
    }

    await product.save();
    const populatedProduct = await Product.findById(product._id)
                    .populate("media", "images type _id")
                    .populate("category", "name slug heading _id")
                    .populate("industry", "name slug heading id")
                    .populate("product_unit", "_id name description")
                    .populate("subcategories", "name slug heading image")
                    .populate("specifications.spec_id", "spec_id inputType options")
                    .populate("additional_details.additional_id", "name inputType options");


    return resp.status(200).json( new ApiResponse(200, populatedProduct, "Product specifications added successfully.") );

} )


export const addProductAdditionalDetails = asyncHandler ( async(req, resp) =>{
    
    const { productId, additional_details } = req.body;
    const loggedInUser = req.user;

    const schema = Joi.object({
        productId: Joi.string().required(),
        additional_details: Joi.array().items(
            Joi.object({
                additional_id: Joi.string(),
                name: Joi.string().when("additional_id", {
                    is: Joi.string().required(),
                    then: Joi.forbidden(),
                    otherwise: Joi.required()
                }),
                value: Joi.alternatives().try(
                    Joi.string(),
                    Joi.array().items(Joi.string())
                ).required()
            })
        ).required()
    });

    await schema.validateAsync({ productId: productId, additional_details }, { abortEarly: false });

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found.");

    if (product.seller_id.toString() !== loggedInUser._id.toString()) {
        throw new ApiError(400, "Unauthorized action. This product does not belong to you!");
    }

    const incomingAddiIds = additional_details.filter(d => d.additional_id).map(d => d.additional_id.toString());
    const incomingCustomNames = additional_details.filter(d => !d.additional_id).map(d => d.name.trim().toLowerCase());

    product.additional_details = product.additional_details.filter(existing => {
        if (existing.additional_id) {
            return incomingAddiIds.includes(existing.additional_id.toString());
        } else {
            return incomingCustomNames.includes(existing.name.trim().toLowerCase());
        }
    });


    // 5. Add or update
    additional_details.forEach(detail => {
        if (detail.additional_id) {
            const existingIndex = product.additional_details.findIndex(
                d => d.additional_id?.toString() === detail.additional_id
            );
            if (existingIndex > -1) {
                product.additional_details[existingIndex].value = detail.value;
            } else {
                product.additional_details.push({ additional_id: detail.additional_id, value: detail.value });
            }
        } else {
            // custom field
            const existingIndex = product.additional_details.findIndex(
                d => !d.additional_id && d.name.trim().toLowerCase() === detail.name.trim().toLowerCase()
            );
            if (existingIndex > -1) {
                product.additional_details[existingIndex].value = detail.value;
            } else {
                product.additional_details.push({ name: detail.name.trim(), value: detail.value });
            }
        }
    });
    

    if (product.stages) {
        product.stages.additional_details = true;
    }


    await product.save();
    const populatedProduct = await Product.findById(product._id)
                .populate("media", "images type _id")
                .populate("category", "name slug heading _id")
                .populate("industry", "name slug heading id")
                .populate("product_unit", "_id name description")
                .populate("subcategories", "name slug heading image")
                .populate("specifications.spec_id", "spec_id inputType options")
                .populate("additional_details.additional_id", "name inputType options");


    return resp.status(200).json( new ApiResponse(200, populatedProduct, "Product additional details added successfully.") );

});