import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';

import { SubCategories } from "../../models/subCategories.model.js";
import { SubCategorySchema } from "../../validators/admin/subcategoryValidator.js";

import {uploadOnCloudinary, deleteFromCloudinary} from "../../utils/cloudinary.js";

const allowedExtensions = [".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;


export const getAllSubCategory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const sub_categories = await SubCategories.find({ isDeleted: false }).populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const totalSubCategory = await SubCategories.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalSubCategory / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
                sub_categories,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalSubCategory,
                    limit,
                },
            },
            "Sub Category fetched successfully",
        ),
    );
    
});

// Get a Category by ID
export const getSubCategoryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const industry = await SubCategories.findById(id).populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            .select("-isDeleted -createdAt -updatedAt -__v");
    if (!industry) {
        return res.status(400).json(new ApiError(400, null, "Sub Category not found"));
    }
    return res.status(200).json(new ApiResponse(200, industry, "Sub Category fetched successfully"));
});


// Create a new Category
export const createSubCategory = asyncHandler(async (req, res) => {    
    const { name, heading, category_id, group} = req.body;

    let { slug, sr_no } = req.body;    
    let imageUrl = null;
    
    try {
        await SubCategorySchema.validateAsync({ name,slug, heading, sr_no, category_id, group, operation: "create" },{ abortEarly: false });
        slug = convertSlug(slug);

        const lastCategory = await SubCategories.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
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
        imageUrl = await uploadOnCloudinary(req.file.path, "sub-categories");

        const sub_categories = await SubCategories.create({ name, slug,  heading, image: imageUrl, sr_no , category: category_id, group: group });
        return res.status(201).json(new ApiResponse(201, sub_categories, "Sub Category created successfully"));

    } catch (error) {      
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        if (error.isJoi) {
            return res.status(400).json( new ApiResponse( 400, null, error.details.map((detail) => detail.message)) );
        }       

        if (error.code === 11000 && error.keyValue?.name) {            
            return res.status(400).json(new ApiResponse(400, null, "Sub Category with this name already exists"));
        }        
        return res.status(400).json(new ApiError(400, error ));
    }

});


// Update a Category
export const updateSubCategory = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const { name, heading, category_id, group} = req.body;
    let { slug, sr_no } = req.body;    
    let imageUrl = null;
    
    try {

        await SubCategorySchema.validateAsync({ id, name, slug, heading, sr_no, category_id, group, operation: "update" },{ abortEarly: false });
        slug = convertSlug(slug);

        const sub_category = await SubCategories.findOne({ _id: id, deleted: { $ne: true } });
        if (!sub_category) {
            throw new ApiError(404,  "Sub Category not found");
        }

        const updatedSlug = name ? convertSlug(name) : slug;

        if (req.file) {
            const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf("."));
            if (!allowedExtensions.includes(fileExtension)) {
                return res.status(400).json(new ApiResponse(400, null, "Invalid file extension. Only .jpg, .jpeg, and .png are allowed."));
            }

            if (req.file.size > maxFileSize) {
                return res.status(400).json(new ApiResponse(400, null, "File size exceeds the 2MB limit."));
            }

            if (sub_category.image) {
                await deleteFromCloudinary(sub_category.image);
            }
            imageUrl = await uploadOnCloudinary(req.file.path, "sub-categories");
        }

        // Update the industry fields in the database
        sub_category.name = name || sub_category.name;
        sub_category.slug = updatedSlug || sub_category.slug;
        sub_category.heading = heading || sub_category.heading;
        sub_category.sr_no = sr_no || sub_category.sr_no;
        sub_category.image = imageUrl || sub_category.image;
        sub_category.category = category_id || sub_category.category;
        sub_category.group = group || sub_category.groups;

        await sub_category.save();

        return res.status(200).json(new ApiResponse(200, sub_category, "Sub Category updated successfully"));
    } catch (error) {
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        if (error.isJoi) {
            return res.status(400).json(new ApiResponse(400, null, error.details.map((detail) => detail.message)));
        }
        return res.status(500).json(new ApiError(500, error.message));
    }
});


// Delete a city
export const deleteSubCategory = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const subCategory = await SubCategories.findOne({ _id: id, deleted: { $ne: true } });
        if (!subCategory) {
            return res.status(404).json(new ApiResponse(404, null, "Sub Category not found or already deleted"));
        }

        await subCategory.delete();
        return res.status(200).json(new ApiResponse(200, null, "Sub Category deleted successfully"));

    } catch (error) {
        console.error(error);
        return res.status(500) .json(new ApiError(500, null, "Internal server error"));
    }

});

