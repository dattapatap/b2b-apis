import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";


import { Countries } from "../../models/country.model.js";

export const getAll = asyncHandler(async (req, res) => {
    const countries = await Countries.find({ country_status: 'active', deleted: { $ne:true } })
                            .select('-createdAt -updatedAt -deleted -__v');
    return res.status(200).json( new ApiResponse( 200, countries, "Countries fetched successfully"));    
});

