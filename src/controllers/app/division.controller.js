import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";


import { Divisions } from "../../models/Admin/division.model.js";

export const getAll = asyncHandler(async (req, res) => {
    const divisions = await Divisions.find({ deleted: { $ne:true } }).sort({ 'sr_no' : 1});
    return res.status(200).json( new ApiResponse( 200, divisions, "Divisions fetched successfully"));    
});

