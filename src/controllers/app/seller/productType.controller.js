import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import { ProductType } from "../../../models/productType.model.js";


export const getAllProductTypes = asyncHandler(async (req, res) => {
    const productTypes = await ProductType.find({ deleted: { $ne : true} }).select("-createdAt -updatedAt -__v -deleted");
    return res.status(200).json(  new ApiResponse( 200, productTypes, "Product types fetched successfully") );
});

