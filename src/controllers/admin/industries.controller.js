import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';

import {Industries} from "../../models/industries.modal.js";
import { IndustrySchema } from "../../validators/admin/industryValidator.js";

import {uploadOnCloudinary, deleteFromCloudinary} from "../../utils/cloudinary.js";

const allowedExtensions = [".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;


// Create a new Industry
export const createIndustry = asyncHandler(async (req, res) => {    
    const { name, heading} = req.body;
    let { slug, sr_no } = req.body;    
    let imageUrl = null;

    try {
        await IndustrySchema.validateAsync({ name,slug, heading, sr_no, operation: "create" },{ abortEarly: false });

        slug = convertSlug(slug);
        
        const lastIndustry = await Industries.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
        sr_no = lastIndustry?.sr_no ? lastIndustry.sr_no + 1 : 1;

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
        imageUrl = await uploadOnCloudinary(req.file.path, "industries");

        const industry = await Industries.create({ name, slug, image: imageUrl, heading, sr_no });
        return res.status(201).json(new ApiResponse(201, industry, "Industry created successfully"));


    } catch (error) {      
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        if (error.isJoi) {
            return res.status(400).json( new ApiResponse( 400, null, error.details.map((detail) => detail.message)) );
        }       

        if (error.code === 11000 && error.keyValue?.name) {            
            return res.status(400).json(new ApiResponse(400, null, "Industry with this name already exists"));
        }        
        return res.status(500).json(new ApiError(500, error.message ));
    }

});


export const getAllIndustry = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const industry = await Industries.find({ isDeleted: false }).skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt");
    const totalIndustry = await Industries.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalIndustry / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
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
export const getIndustryById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const industry = await Industries.findById(id).select("-isDeleted -createdAt -updatedAt");;
    if (!industry) {
        throw new ApiError(404, "Industry not found");
    }

    return res.status(200).json(new ApiResponse(200, industry, "Industry fetched successfully"));
});

// Update a Industry
export const updateIndustry = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const { name, heading, slug, sr_no } = req.body; 
    let imageUrl = null;

    try {
        await IndustrySchema.validateAsync( { id, name, slug, heading, sr_no, operation: "update" }, { abortEarly: false } );

        const industry = await Industries.findOne({ _id: id, isDeleted: false });
        if (!industry) {
            return res.status(404).json(new ApiResponse(404, null, "Industry not found"));
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

            if (industry.image) {
                await deleteFromCloudinary(industry.image);
            }
            imageUrl = await uploadOnCloudinary(req.file.path, "industries");
        }

        // Update the industry fields in the database
        industry.name = name || industry.name;
        industry.slug = updatedSlug || industry.slug;
        industry.heading = heading || industry.heading;
        industry.sr_no = sr_no || industry.sr_no;
        industry.image = imageUrl || industry.image;

        await industry.save();

        return res.status(200).json(new ApiResponse(200, industry, "Industry updated successfully"));
    } catch (error) {
        // Delete uploaded image if validation fails
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        // Handle Joi validation errors
        if (error.isJoi) {
            return res.status(400).json(new ApiResponse(400, null, error.details.map((detail) => detail.message)));
        }

        // Handle unexpected errors
        console.error(error.message);
        return res.status(500).json(new ApiError(500, error.message));
    }
});

// Delete a city
export const deleteIndustry = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const industry = await Industries.findOne({ _id: id, isDeleted: false });
        if (!industry) {
            return res.status(404).json(new ApiResponse(404, null, "Industry not found or already deleted"));
        }

        industry.isDeleted = true;
        await industry.save();
        return res.status(200).json(new ApiResponse(200, null, "Industry deleted successfully"));

    } catch (error) {
        console.error(error);
        return res.status(500) .json(new ApiError(500, null, "Internal server error"));
    }

});

