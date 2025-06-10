import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Brands} from "../../models/brands.model.js";
import { BrandSchema } from "../../validators/admin/brandValidator.js";
import { fileRule } from "../../rules/fileRules.js";

import {uploadOnCloudinary, deleteFromCloudinary} from "../../utils/cloudinary.js";

const allowedExtensions = [".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;


export const getAllBrands = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const brands = await Brands.find({ isDeleted: false }).skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt");
    const totalBrands = await Brands.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);

    return res.status(200).json(
        new ApiResponse( 200, { 
                brands,
                pagination: { currentPage: page, totalPages, totalBrands, limit },
            }, "Brands fetched successfully", ),
    );
    
});


// Get a Brand by ID
export const getBrandById = asyncHandler(async (req, res) => { 
    const {id} = req.params;
    const brand = await Brands.findById(id).select("-isDeleted -createdAt -updatedAt");;
    if (!brand) {
        return res.status(400).json(new ApiError(400, null, "Brand not found"));
    }
    return res.status(200).json(new ApiResponse(200, brand, "Brand fetched successfully"));
});


// Create a new Brand
export const createBrand = asyncHandler(async (req, res) => {    
    const { name, heading} = req.body;
    let { slug, sr_no } = req.body;    
    let imageUrl = null;

    try {
        await BrandSchema.validateAsync({ name, sr_no, operation: "create" },{ abortEarly: false });

        const lastBrand = await Brands.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
        sr_no = lastBrand?.sr_no ? lastBrand.sr_no + 1 : 1;

        const fileValidation = fileRule(req.file, maxFileSize, allowedExtensions);
        if (!fileValidation.isValid) {
            return res.status(400).json(new ApiResponse(400, null, fileValidation.message));
        }

        imageUrl = await uploadOnCloudinary(req.file.path, "brands");

        const brand = await Brands.create({ name, image: imageUrl, sr_no });
        return res.status(201).json(new ApiResponse(201, brand, "Brand created successfully"));

    } catch (error) {      
        console.log(error);      

        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }
        if (error.isJoi) {
            return res.status(400).json( new ApiResponse( 400, null, error.details.map((detail) => detail.message)) );
        }       
        if (error.code === 11000 && error.keyValue?.name) {            
            return res.status(400).json(new ApiResponse(400, null, "Brand with this name already exists"));
        }        
        return res.status(500).json(new ApiError(500, error.message ));
    }

});


// Update a Brand
export const updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const { name, slug, sr_no } = req.body; 
    let imageUrl = null;

    try {
        await BrandSchema.validateAsync( { id, name, sr_no, operation: "update" }, { abortEarly: false } );

        const brand = await Brands.findOne({ _id: id, isDeleted: false });
        if (!brand) {
            return res.status(404).json(new ApiResponse(404, null, "Brand not found"));
        }

        if (req.file) {
            const fileValidation = fileRule(req.file, maxFileSize, allowedExtensions);
            if (!fileValidation.isValid) {
                return res.status(400).json(new ApiResponse(400, null, fileValidation.message));
            }

            if (brand.image) {
                await deleteFromCloudinary(brand.image);
            }
            imageUrl = await uploadOnCloudinary(req.file.path, "brands");
        }

        brand.name = name || brand.name;
        brand.sr_no = sr_no || brand.sr_no;
        brand.image = imageUrl || brand.image;

        await brand.save();

        return res.status(200).json(new ApiResponse(200, brand, "Industry updated successfully"));
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

// Delete a Brand
export const deleteBrand = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const brand = await Brands.findOne({ _id: id, isDeleted: false });
        if (!brand) {
            return res.status(404).json(new ApiResponse(404, null, "Brand not found or already deleted"));
        }

        brand.isDeleted = true;
        await brand.save();
        return res.status(200).json(new ApiResponse(200, null, "Brand deleted successfully"));

    } catch (error) {
        console.error(error);
        return res.status(500) .json(new ApiError(500, null, "Internal server error"));
    }

});

