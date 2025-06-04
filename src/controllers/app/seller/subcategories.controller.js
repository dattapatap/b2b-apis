import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import { findSubcategories } from '../../../utils/helper.js';

import { SubCategories } from "../../../models/subCategories.model.js";
import { Product } from "../../../models/product.model.js";

export const getAllSubCategory = asyncHandler(async (req, res) => {
    const product_id = req.body.product_id
       
    const product = await Product.findById(product_id);
    if(!product){
        throw new ApiError(404, "Product Not Found!");
    }
    const matchedSubcategories = await findSubcategories(product.name);
    if (!matchedSubcategories || matchedSubcategories.length === 0) {
        throw new ApiError(400, "No matching subcategory found for the product name. please contact to the administator");
    }
    return res.status(200).json(  new ApiResponse( 200, matchedSubcategories, "Sub Category fetched successfully") );

});
