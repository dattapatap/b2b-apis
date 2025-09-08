import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {States} from "../../models/state.model.js";
import {StateSchema} from "../../validators/admin/stateValidator.js";

export const createState = asyncHandler(async (req, res) => {
    const {state_name, state_code, country_id} = req.body;
    await StateSchema.validateAsync(
        {state_name, state_code, country_id, operation: "create"},
        {abortEarly: false},
    );
    const country = await States.create({state_name, state_code, country_id});
    return res.status(201).json(new ApiResponse(201, country, "State created successfully"));
});


export const updateState = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {state_name, state_code, country_id} = req.body;

    const existingState = await States.findOne({_id: id, deleted: {$ne: true}});
    if (!existingState) {
        throw new ApiError(404, "State not found");
    }
    const updatedState = await States.findByIdAndUpdate(
        id,
        {state_name, state_code, country_id},
        {new: true},
    );
    return res.status(200).json(new ApiResponse(200, updatedState, "State updated successfully"));
});


export const deleteState = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const existingState = await States.findOne({_id: id, deleted: {$ne: true}});
    if (!existingState) {
        throw new ApiError(404, "State not found");
    }

    await States.delete({_id: id});

    return res.status(200).json(new ApiResponse(200, null, "State deleted successfully"));
});
