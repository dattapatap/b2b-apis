import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import {Pincode} from "../../models/pincode.model.js";
import {pincodeSchema} from "../../validators/admin/pincodeValidator.js";

export const getAllPinCode = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pincode = await Pincode.find({deleted: {$ne: true}})
        .skip(skip)
        .limit(limit)
        .select("-isDeleted");
    const totalPinCode = await Pincode.find({deleted: {$ne: true}}).countDocuments();
    const totalPages = Math.ceil(totalPinCode / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                pincode,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalPinCode,
                    limit,
                },
            },
            "Pin_Code fetched successfully",
        ),
    );
});

//get a pin_code by id
export const getPinCodeById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const pincode = await Pincode.findOne({_id: id, deleted: {$ne: true}}).select("-isDeleted");
    if (!pincode) {
        throw new ApiError(404, "PinCode not found");
    }

    return res.status(200).json(new ApiResponse(200, pincode, "Pin_Code fetched successfully"));
});

// create a new pin_code
export const createPinCode = asyncHandler(async (req, res) => {
    console.log("Creating country with body:", req.body);

    const {pin_code, zone, city, state_id} = req.body;
    await pincodeSchema.validateAsync(
        {pin_code, zone, city, state_id, operation: "create"},
        {abortEarly: false},
    );

    const pincode = await Pincode.create({
        pin_code,
        zone,
        city,
        state_id,
    });

    return res.status(201).json(new ApiResponse(201, pincode, "Pin Code created successfully"));
});

// update a pin_code
export const updatePinCode = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {Pin_code, zone, city, state_id} = req.body;

    const existingPinCode = await Pincode.findOne({_id: id, deleted: {$ne: true}});
    if (!existingPinCode) {
        throw new ApiError(404, "PinCode not found");
    }

    const updatedPinCode = await Pincode.findByIdAndUpdate(
        id,
        {Pin_code, zone, city, state_id},
        {new: true},
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPinCode, "PinCode updated successfully"));
});

export const updatePinCodeStatus = asyncHandler(async (req, res) => {
    try {
        const {id} = req.params;

        const pincode = await Pincode.findById(id);
        if (!pincode) {
            return res.status(404).json(new ApiResponse(404, null, "Pin_Code not found"));
        }

        pincode.active = !pincode.active;
        await pincode.save(); // ✅ save changes

        return res
            .status(200)
            .json(new ApiResponse(200, pincode, "Pin_Code status updated successfully"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message));
    }
});

//delete a PinCode
export const deletePinCode = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        const pincode = await Pincode.findOne({_id: id, deleted: {$ne: true}});
        if (!pincode) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Country not found or already deleted"));
        }

        await pincode.delete();
        return res.status(200).json(new ApiResponse(200, null, "Country deleted successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new ApiError(500, country, "Internal server error"));
    }
});
