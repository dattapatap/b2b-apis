import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';

import { Categories } from "../../models/categories.model.js";
import { CategorySchema } from "../../validators/admin/categoryValidator.js";

import {uploadOnCloudinary, deleteFromCloudinary} from "../../utils/cloudinary.js";

const allowedExtensions = [".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;



export const getAllCategory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const categories = await Categories.find({ isDeleted: false }).populate("industry", '-__v -isDeleted -createdAt -updatedAt')
                            .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const totalCategory = await Categories.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalCategory / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
                categories,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCategory,
                    limit,
                },
            },
            "Category fetched successfully",
        ),
    );
    
});

// Get a Category by ID
export const getCategoryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const industry = await Categories.findById(id).populate("industry", '-__v -isDeleted -createdAt -updatedAt')
                            .select("-isDeleted -createdAt -updatedAt -__v");
    if (!industry) {
        return res.status(400).json(new ApiError(400, null, "Category not found"));
    }
    return res.status(200).json(new ApiResponse(200, industry, "Category fetched successfully"));
});



// Create a new Category
export const createCategory = asyncHandler(async (req, res) => {    
    const { name, heading, industry_id} = req.body;
    let { slug, sr_no } = req.body;    
    let imageUrl = null;
    
    try {
        await CategorySchema.validateAsync({ name,slug, heading, sr_no, industry_id, operation: "create" },{ abortEarly: false });
        slug = convertSlug(slug);

        const lastCategory = await Categories.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
        sr_no = lastCategory?.sr_no ? lastCategory.sr_no + 1 : 1;

        if (!req.file) {
            return res.status(400).json(new ApiResponse(400, null, "Image is required field"));
        }

        const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf("."));
        if (!allowedExtensions.includes(fileExtension)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid file extension. Only .jpg, .jpeg, and .png are allowed."));
        }
    
        if (req.file.size > maxFileSize) {
            return res.status(400).json(new ApiResponse(400, null, "File size exceeds the 2MB limit."));
        }
        imageUrl = await uploadOnCloudinary(req.file.path, "categories");

        const categories = await Categories.create({ name, slug,  heading, image: imageUrl, sr_no , industry: industry_id });
        return res.status(201).json(new ApiResponse(201, categories, "Category created successfully"));

    } catch (error) {      
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        if (error.isJoi) {
            return res.status(400).json( new ApiResponse( 400, null, error.details.map((detail) => detail.message)) );
        }       

        if (error.code === 11000 && error.keyValue?.name) {            
            return res.status(400).json(new ApiResponse(400, null, "Category with this name already exists"));
        }        
        return res.status(400).json(new ApiError(400, error ));
    }

});


// Update a Category
export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const { name, heading, industry_id} = req.body;
    let { slug, sr_no } = req.body;    
    let imageUrl = null;
    
    try {

        await CategorySchema.validateAsync({ id, name, slug, heading, sr_no, industry_id, operation: "update" },{ abortEarly: false });
        slug = convertSlug(slug);

        const category = await Categories.findOne({ _id: id, isDeleted: false });
        if (!category) {
            return res.status(404).json(new ApiResponse(404, null, "Category not found"));
        }

        const updatedSlug = name ? convertSlug(name) : slug;

        // if file attached upload and remove old file
        if (req.file) {
            const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf("."));
            if (!allowedExtensions.includes(fileExtension)) {
                return res.status(400).json(new ApiResponse(400, null, "Invalid file extension. Only .jpg, .jpeg, and .png are allowed."));
            }

            if (req.file.size > maxFileSize) {
                return res.status(400).json(new ApiResponse(400, null, "File size exceeds the 2MB limit."));
            }

            if (category.image) {
                await deleteFromCloudinary(category.image);
            }
            imageUrl = await uploadOnCloudinary(req.file.path, "categories");
        }

        // Update the industry fields in the database
        category.name = name || category.name;
        category.slug = updatedSlug || category.slug;
        category.heading = heading || category.heading;
        category.sr_no = sr_no || category.sr_no;
        category.image = imageUrl || category.image;
        category.industry = industry_id || category.industry;

        await category.save();

        return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
    } catch (error) {
        // Delete uploaded image if validation fails
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        // Handle Joi validation errors
        if (error.isJoi) {
            return res.status(400).json(new ApiResponse(400, null, error.details.map((detail) => detail.message)));
        }
        return res.status(500).json(new ApiError(500, error.message));
    }
});


// Delete a city
export const deleteCategory = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const industry = await Categories.findOne({ _id: id, isDeleted: false });
        if (!industry) {
            return res.status(404).json(new ApiResponse(404, null, "Category not found or already deleted"));
        }

        industry.isDeleted = true;
        await industry.save();
        return res.status(200).json(new ApiResponse(200, null, "Category deleted successfully"));

    } catch (error) {
        console.error(error);
        return res.status(500) .json(new ApiError(500, null, "Internal server error"));
    }

});

