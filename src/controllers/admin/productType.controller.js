import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import { ProductType } from "../../models/productType.model.js";
import { ProductTypeValicator } from "../../validators/admin/productTypeValidator.js";


export const getAllProductTypes = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 40; 
    const skip = (page - 1) * limit;

    const productTypes = await ProductType.find({ isDeleted: false }).skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const totalTypes = await ProductType.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(totalTypes / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
                productTypes,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalTypes,
                    limit,
                },
            },
            "Product types fetched successfully",
        ),
    );
    
});


// Get a types by __id
export const getProductTypeById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const productType = await ProductType.findById(id).select("-isDeleted -createdAt -updatedAt -__v");
    if (!productType) {
        throw new ApiError(404, "Product type not found");
    }
    return res.status(200).json(new ApiResponse(200, productType, "Product types fetched successfully"));
});


// Create a new Product Type
export const createProductType = asyncHandler(async (req, res) => {    
    const { name, description} = req.body;    
    await ProductTypeValicator.validateAsync({  name, description,  operation: "create"  } , { abortEarly: false });
    const product_type = await ProductType.create({ name, description });
    return res.status(201).json(new ApiResponse(201, product_type, "Product type created successfully"));

});


// Update a Product type
export const updateProductType = asyncHandler(async (req, res) => {
    const { name, description} = req.body;
    const { id } = req.params;  

    await ProductTypeValicator.validateAsync({ id, name, description, operation: "update" },{ abortEarly: false });

    const product_type = await ProductType.findOne({ _id: id, isDeleted: false });
    if (!product_type) {
        throw new ApiError(404,  "Product type not found");
    }

    product_type.name = name || product_type.name;
    product_type.description = description || product_type.description;
    await product_type.save();

    return res.status(200).json(new ApiResponse(200, product_type, "Collection updated successfully"));    

});


// Delete a city
export const deleteProductType = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const productType = await ProductType.findOne({ _id: id, isDeleted: false });
    if (!productType) {
        throw new ApiError(404, "Product type not found or already deleted");
    }


   await productType.delete(); // Soft delete
    return res.status(200).json(new ApiResponse(200, null, "Product type deleted successfully"));

});

