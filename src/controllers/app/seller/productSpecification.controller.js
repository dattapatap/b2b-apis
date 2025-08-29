import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import { Product } from "../../../models/product.model.js";
import { Specifications } from "../../../models/specifications.model.js";
import { Additionals } from "../../../models/additionals.model.js";

export const getProductSpecifications = asyncHandler(async (req, res) => {
    const productId = req.params.productId

    const product = await Product.findById(productId).select("subcategories");
    if(!product){
        throw new ApiError(404, "Product Not Found!");
    }

    const subcategoryIds = product.subcategories;

    const specifications = await Specifications.aggregate([
        {
            $match: {
                subcategories: { $in: subcategoryIds },
                deleted: { $ne : true },
            }
        },
        { $sort: { displayOrder: 1 }  },
        { $group: { _id: "$name",  doc: { $first: "$$ROOT" }  }  },
        { $replaceRoot: { newRoot: "$doc" } },
        { $project: { id: "$_id", name: 1, inputType: 1, options: 1 ,_id: 0} }
    ]);

    return res.status(200).json(  new ApiResponse( 200, specifications, "Matched Specifications fetched successfully") );
    
});


export const getProductAdditionalDetails = asyncHandler(async (req, res) => {
    const additionalDetails = await Additionals.find({ isDeleted: false }).sort({ displayOrder: 1 }) 
    return res.status(200).json(new ApiResponse(200, additionalDetails, "Additional details fetched successfully"));
});