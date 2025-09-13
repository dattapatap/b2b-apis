import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';

import { Additionals } from "../../models/additionals.model.js";
import {  additionalsValidatorSchema } from "../../validators/admin/additionalsValidator.js";

export const getAllFields = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 20; 
    const skip = (page - 1) * limit;

    const additionlas = await Additionals.find({ isDeleted: false })
                            .skip(skip).limit(limit).select("-isDeleted -createdAt -updatedAt -__v");
    const additionlasTotal = await Additionals.find({ isDeleted: false }).countDocuments();
    const totalPages = Math.ceil(additionlasTotal / limit);

    return res.status(200).json(
        new ApiResponse( 200, {
            additionlas,
                pagination: {
                    currentPage: page,
                    totalPages,
                    additionlasTotal,
                    limit,
                },
            },
            "Additionlas product fields fetched successfully",
        ),
    );
    
});


export const getFieldById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const additional = await Additionals.findById(id)
                            .select("-isDeleted -createdAt -updatedAt -__v");
    if (!additional) {
        throw new ApiError(404, "Product Additional fields not found");
    }
    return res.status(200).json(new ApiResponse(200, additional, "Product Additional fields fetched successfully"));
});


export const createFields = asyncHandler(async (req, res) => {    
    const { name, input_type, options, display_order } = req.body; 
    await additionalsValidatorSchema.validateAsync({ name, input_type, options, display_order, operation: "create" },{ abortEarly: false });
    const additionals = await Additionals.create(
        { name, inputType: input_type, options, displayOrder: display_order }
    );
    return res.status(201).json(new ApiResponse(201, additionals, "Additional Details created successfully"));   
});


export const updateField = asyncHandler(async (req, res) => {    
    const { id } = req.params;  
    const { sub_category, name, input_type, options, display_order } = req.body; 

    await additionalsValidatorSchema.validateAsync({ id, name, input_type, options, display_order, operation: "update"  },{ abortEarly: false });

    const additional = await Additionals.findOne({ _id: id, isDeleted: false });
    if (!additional) { throw new ApiError(404, "Additionals details not found!") }

    additional.name         = name || additional.name;
    additional.inputType    = input_type || additional.inputType;
    additional.options      = options || additional.options;
    additional.displayOrder = display_order || additional.displayOrder;
    await additional.save();
    
    return res.status(200).json(new ApiResponse(200, additional, "Additional detail updated successfully!"));
});


export const deleteField = asyncHandler(async (req, res) => {
    const {id} = req.params;
  
    const additional = await Additionals.findOne({ _id: id, isDeleted: false});
    if (!additional) {            
        throw new ApiError(404, "Additional detail not found or already deleted");
    }
    
    additional.isDeleted = true;
    await additional.save();
    return res.status(200).json(new ApiResponse(200, null, "Additional detail deleted successfully"));
});

