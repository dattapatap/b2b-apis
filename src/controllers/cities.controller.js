import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";

import {Cities} from "../models/cities.model.js";


export const getAllCities = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const limit = parseInt(req.query.limit) || 20; // Default limit is 20
    const skip = (page - 1) * limit;

    // Fetch cities with pagination
    const cities = await Cities.find().skip(skip).limit(limit);
    const totalCities = await Cities.countDocuments(); // Total number of cities
    const totalPages = Math.ceil(totalCities / limit); // Total pages

    // Return paginated response
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

// Get a city by ID
export const getCityById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const city = await Cities.findById(id);
    if (!city) {
        throw new ApiError(404, "City not found");
    }

    return res.status(200).json(new ApiResponse(200, city, "City retrieved successfully"));
});

