import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';

import { Specifications } from "../../models/specifications.model.js";
import { specificationsSchema } from "../../validators/admin/specificationsValidator.js";

export const getAllSpecifications = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    console.log("info", "Fetching all specifications from the database");
    const specifications = await Specifications.find({ isDeleted: false })
                            .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v")
                            .populate({
                                path: "subcategories",
                                select: "name __id", 
                            });
                    
    const specificationsTotal = await Specifications.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(specificationsTotal / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
            specifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    specificationsTotal,
                    limit,
                },
            },
            "Specifications fetched successfully",
        ),
    );
    
});


// Get a Category by ID
export const getSpecificationById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const specification = await Specifications.findById(id)
                            // .populate("category", '-__v -isDeleted -createdAt -updatedAt')
                            // .populate("subcategory", '-__v -isDeleted -createdAt -updatedAt')
                            .select("-isDeleted -createdAt -updatedAt -__v");
    if (!specification) {
        throw new ApiError(404, "Specification not found");
    }
    return res.status(200).json(new ApiResponse(200, specification, "Specification fetched successfully"));
});


// Create a new Collection
export const createSpecifications = asyncHandler(async (req, res) => {    
    const { sub_category, name, input_type, options, display_order } = req.body; 

    await specificationsSchema.validateAsync({ sub_category, name, input_type, options, display_order, operation: "create" },{ abortEarly: false });
    const specification = await Specifications.create(
        { subcategories: sub_category , name, inputType: input_type, options, displayOrder: display_order }
    );
    return res.status(201).json(new ApiResponse(201, specification, "Specification created successfully"));   
});


// Update a Collection
export const updateSpecifications = asyncHandler(async (req, res) => {
    const { id } = req.params;  
    const { sub_category, name, input_type, options, display_order } = req.body; 

    await specificationsSchema.validateAsync({ id, sub_category, name, input_type, options, display_order, operation: "update"  },{ abortEarly: false });

    const specifications = await Specifications.findOne({ _id: id, isDeleted: false });
    if (!specifications) { throw new ApiError(404, "Specification not found") }

    specifications.name         = name || specifications.name;
    specifications.inputType    = input_type || specifications.inputType;
    specifications.options      = options || specifications.options;
    specifications.displayOrder = display_order || specifications.displayOrder;
    specifications.subcategories = sub_category ?? specification.subcategories;

    await specifications.save();
    
    return res.status(200).json(new ApiResponse(200, specifications, "Specifications updated successfully"));
});


// Delete a city
export const deleteSpecification = asyncHandler(async (req, res) => {
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

