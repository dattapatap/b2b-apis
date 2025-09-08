import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import {Cities} from "../../../models/cities.model.js";
import {citySchema} from "../../../validators/admin/cityValidator.js";

import {uploadOnCloudinary, deleteFromCloudinary} from "../../../utils/cloudinary.js";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const maxFileSize = 1 * 1024 * 1024;

export const getAllCities = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cities = await Cities.find({deleted: { $ne : true} }).populate('state', 'state_name state_code' ).skip(skip)
        .limit(limit)
        .select("-createdAt -updatedAt");
    const totalCities = await Cities.find({ deleted: { $ne : true} }).countDocuments();
    const totalPages = Math.ceil(totalCities / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                cities,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCities,
                    limit,
                },
            },
            "Cities retrieved successfully",
        ),
    );
});


// Create a new city
export const createCity = asyncHandler(async (req, res) => {
    const {name, description, state} = req.body;
    let imageUrl = null;

    await citySchema.validateAsync( {name, description, state, operation: "create"}, {abortEarly: false}, );

    if (!req.file) {
        return res.status(400).json(new ApiResponse(400, null, "City Image is required field"));
    }
    const fileExtension = req.file.originalname.substring( req.file.originalname.lastIndexOf("."), );
    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400)
            .json(new ApiResponse( 400, null, "Invalid file extension. Only .jpg, .jpeg, and .png are allowed.", ),
        );
    }   
    if (req.file.size > maxFileSize) {
        return res.status(400).json(new ApiResponse(400, null, "File size exceeds the 1MB limit."));
    }

    imageUrl = await uploadOnCloudinary(req.file.path, "cities");

    const city = await Cities.create({name, state, image: imageUrl, description});

    const populatedCity = await Cities.findById(city._id).populate('state', 'state_name id state_code');
    
    return res.status(201).json(new ApiResponse(201, populatedCity, "City created successfully"));

});



// Get a city by ID
export const getCityById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const city = await Cities.findById(id).select("-deleted").populate('state', 'state_name state_code' );
    if (!city) {
        throw new ApiError(404, "City not found");
    }
    return res.status(200).json(new ApiResponse(200, city, "City retrieved successfully"));
});

// Update a city
export const updateCity = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, description, state} = req.body;
    let imageUrl = null;

    try {
        await citySchema.validateAsync( {name, description, state, id, operation: "update"}, {abortEarly: false}, );

        const city = await Cities.findById(id);
        if (!city) {
            return res.status(400).json(new ApiError(400, null, "City not found."));
        }

        if (req.file) {
            const fileExtension = req.file.originalname.substring(
                req.file.originalname.lastIndexOf("."),
            );
            if (!allowedExtensions.includes(fileExtension)) {
                return res.status(400).json(
                        new ApiResponse( 400, null, "Invalid file extension. Only .jpg, .jpeg, and .png are allowed.",),
                    );
            }

            if (req.file.size > maxFileSize) {
                return res.status(400).json(new ApiResponse(400, null, "File size exceeds the 1MB limit."));
            }

            imageUrl = await uploadOnCloudinary(req.file.path, "cities");
            if (city.image) {
                await deleteFromCloudinary(city.image);
            }
        }

        const updateData = {
            name: name || city.name,
            description: description || city.description,
            state: state || city.state,
            image: imageUrl || city.image,
        };

        const updatedCity = await Cities.findByIdAndUpdate(id, updateData, {new: true}).select('-deleted').populate('state', 'state_name id state_code');

        return res.status(200).json(new ApiResponse(200, updatedCity, "City updated successfully"));
    } catch (error) {
        if (imageUrl) {
            await deleteFromCloudinary(imageUrl);
        }

        if (error.isJoi) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    error.details.map((detail) => detail.message),
                ),
            );
        }

        if (error.code === 11000 && error.keyValue?.name) {
            return res
                .status(400)
                .json(new ApiResponse(400, null, "City with this name already exists"));
        }
        console.log(error);

        return res.status(500).json(new ApiError(500, null, "Internal server error"));
    }
});

// Delete a city
export const deleteCity = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const city = await Cities.findOne({_id: id, deleted: { $ne:true} });
        if (!city) {
            return res.status(404).json(new ApiResponse(404, null, "City not found or already deleted"));
        }

        await city.delete();

        return res.status(200).json(new ApiResponse(200, null, "City deleted successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiError(500, null, "Internal server error"));
    }
});
