import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../../../utils/cloudinary.js";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const maxFileSize = 2 * 1024 * 1024;

import {Countries} from "../../../models/country.model.js";
import {CountrySchema} from "../../../validators/admin/countryValidator.js";


export const getAllCountry = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const country = await Countries.find({deleted: {$ne: true}}).skip(skip).limit(limit).select("-deleted");
    const totalCountries = await Countries.find({deleted: {$ne: true}}).countDocuments();
    const totalPages = Math.ceil(totalCountries / limit);
  
    return res.status(200).json( new ApiResponse( 200, { country,  
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCountries,
                    limit,
                },
            },
            "Countries fetched successfully",
        ),
    );
});


export const getCountryById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const country = await Countries.findOne({_id: id, deleted: {$ne: true}}).select("-createdAt");
    if (!country) {
        throw new ApiError(404, "Country not found");
    }

    return res.status(200).json(new ApiResponse(200, country, "Country fetched successfully"));
});



export const createCountry = asyncHandler(async (req, res) => {
    const {country_name, country_code} = req.body;
    let imageUrl;

    await CountrySchema.validateAsync( {country_name, country_code, operation: "create"}, {abortEarly: false}, );

    if (!req.file) {
        return res.status(400).json(new ApiResponse(400, null, "Image is required field"));
    }

    const fileExtension = req.file.originalname.substring(
        req.file.originalname.lastIndexOf("."),
    );
    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json( new ApiResponse( 400, null, "Invalid file extension. Only .jpg, .jpeg, .webp and .png are allowed.",),);
    }

    if (req.file.size > maxFileSize) {
        return res.status(400).json( new ApiResponse( 400, null, "File size exceeds the 2MB limit."));
    }

    imageUrl = await uploadOnCloudinary(req.file.path, "countries");
    const country = await Countries.create({
        country_name,
        country_icon: imageUrl,
        country_code
    });
    return res.status(201).json(new ApiResponse(201, country, "Countries created successfully"));
    
});

// update a country
export const updateCountry = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {country_name, country_code} = req.body;
    let imageUrl = null;    

    const existingCountry = await Countries.findOne({_id: id, deleted: {$ne: true}});
    if (!existingCountry) {
        throw new ApiError(404, "Country not found");
    }

    if (req.file) {
        const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf("."),);
        if (!allowedExtensions.includes(fileExtension)) {
            return res.status(400).json( new ApiResponse(400, null, "Invalid file extension. Only .jpg, .jpeg, .webp and .png are allowed.",), );
        }

        if (req.file.size > maxFileSize) {
            return res.status(400).json(new ApiResponse(400, null, "File size exceeds the 2MB limit."));
        }
        imageUrl = await uploadOnCloudinary(req.file.path, "countries");
        if (existingCountry.country_icon) {
            await deleteFromCloudinary(existingCountry.country_icon);
        }
    }


    const updatedCountry = await Countries.findByIdAndUpdate(
        id, {country_name, country_icon : imageUrl || existingCountry.country_icon, country_code},
        {new: true},
    );

    return res.status(200).json(new ApiResponse(200, updatedCountry, "Country updated successfully"));

});

//delete a country
export const deleteCountry = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const country = await Countries.findOne({ _id: id, deleted: { $ne : true} } );
        if (!country) {
            return res.status(404).json(new ApiResponse(404, null, "Country not found or already deleted"));
        }
        await country.delete();
        return res.status(200).json(new ApiResponse(200, null, "Country deleted successfully"));

    } catch (error) {
        console.error(error);
        return res.status(500) .json(new ApiError(500, country, "Internal server error"));
    }

});


