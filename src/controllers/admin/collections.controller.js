import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';

import { Collections } from "../../models/collections.model.js";
import { CollectionSchema } from "../../validators/admin/collectionValidator.js";

import { fileRule } from '../../rules/fileRules.js'
import {uploadOnCloudinary, deleteFromCloudinary} from "../../utils/cloudinary.js";


const allowedExtensions = [".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;


export const getAllCollections = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const collection = await Collections.find({ isDeleted: false }).populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const totalCollection = await Collections.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalCollection / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
            collection,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCollection,
                    limit,
                },
            },
            "Collection fetched successfully",
        ),
    );
    
});


// Get a Category by ID
export const getCollectionById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const collection = await Collections.findById(id)
                            .populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            .populate("subcategory", '-__v -isDeleted -createdAt -updatedAt')
                            .select("-isDeleted -createdAt -updatedAt -__v");
    if (!collection) {
        return res.status(400).json(new ApiError(400, null, "Collection not found"));
    }
    return res.status(200).json(new ApiResponse(200, collection, "Collection fetched successfully"));
});


// Create a new Collection
export const createCollections = asyncHandler(async (req, res) => {    
    const { name, heading, industry, category, sub_category} = req.body;    
    let { slug, sr_no } = req.body;    
    let imageUrl = null;
    
    try {
        await CollectionSchema.validateAsync({  name, slug, heading, sr_no, industry, category, sub_category, operation: "create" },{ abortEarly: false });
        slug = convertSlug(slug);
        const lastCollection = await Collections.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
        sr_no = lastCollection?.sr_no ? lastCollection.sr_no + 1 : 1;

        const fileValidation = fileRule(req.file, maxFileSize, allowedExtensions);
        if (!fileValidation.isValid) {
            return res.status(400).json(new ApiResponse(400, null, fileValidation.message));
        }
        imageUrl = await uploadOnCloudinary(req.file.path, "collections");
    

        const collection = await Collections.create(
            { name, slug,  heading, image: imageUrl, sr_no , industry: industry , category: category, subcategory: sub_category  }
        );
        return res.status(201).json(new ApiResponse(201, collection, "Collection created successfully"));

    } catch (error) {      
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }
        if (error.isJoi) {
            return res.status(400).json( new ApiResponse( 400, null, error.details.map((detail) => detail.message)) );
        }       
        if (error.code === 11000 && error.keyValue?.name) {            
            return res.status(400).json(new ApiResponse(400, null, "Collection with this name already exists"));
        }        
        return res.status(400).json(new ApiError(400, error ));
    }

});


// Update a Collection
export const updateCollections = asyncHandler(async (req, res) => {
    const { name, heading, industry, category, sub_category} = req.body;
    let { slug, sr_no } = req.body;   
    const { id } = req.params;  
    let imageUrl = null;
    
    try {

        await CollectionSchema.validateAsync({ id, name, slug, heading, sr_no, industry, category, sub_category, operation: "update" },{ abortEarly: false });
        slug = convertSlug(slug);

        const collections = await Collections.findOne({ _id: id, isDeleted: false });
        if (!collections) {
            return res.status(404).json(new ApiResponse(404, null, "Collection not found"));
        }

        const updatedSlug = name ? convertSlug(name) : slug;

        // if file attached upload and remove old file
        if (req.file) {
            const fileValidation = fileRule(req.file, maxFileSize, allowedExtensions);
            if (!fileValidation.isValid) {
                return res.status(400).json(new ApiResponse(400, null, fileValidation.message));
            }

            if (collections.image) {
                await deleteFromCloudinary(collections.image);
            }
            imageUrl = await uploadOnCloudinary(req.file.path, "collections");
        }

        // Update the industry fields in the database
        collections.name = name || collections.name;
        collections.slug = updatedSlug || collections.slug;
        collections.heading = heading || collections.heading;
        collections.sr_no = sr_no || collections.sr_no;
        collections.image = imageUrl || collections.image;

        collections.industry = industry || collections.industry;
        collections.category = category || collections.category;
        collections.subcategory = sub_category || collections.sub_category;

        await collections.save();

        return res.status(200).json(new ApiResponse(200, collections, "Collection updated successfully"));
    } catch (error) {
        console.log(error);
        
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
export const deleteCollections = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const collection = await Collections.findOne({ _id: id, isDeleted: false });
        if (!collection) {
            return res.status(404).json(new ApiResponse(404, null, "Collection not found or already deleted"));
        }

        collection.isDeleted = true;
        await collection.save();
        return res.status(200).json(new ApiResponse(200, null, "Collection deleted successfully"));

    } catch (error) {
        console.error(error);
        return res.status(500) .json(new ApiError(500, null, "Internal server error"));
    }

});

