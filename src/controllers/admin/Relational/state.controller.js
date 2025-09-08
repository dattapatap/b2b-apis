import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import {States} from "../../../models/state.model.js";
import {StateSchema} from "../../../validators/admin/stateValidator.js";



export const getAll = asyncHandler( async( req, res ) =>{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const states = await States.find({deleted: {$ne: true}}).skip(skip).limit(limit).select("-deleted").populate('country', 'country_name id country_code');
    const totalStates = await States.find({deleted: {$ne: true}}).countDocuments();
    const totalPages = Math.ceil(totalStates / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                states,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalStates,
                    limit,
                },
            },
            "States fetched successfully",
        ),
    );
})

export const getStateById = asyncHandler( async( req, res ) =>{
    const {id} = req.params;
    const state = await States.findOne({_id: id, deleted: {$ne: true}}).select("-deleted").populate('country', 'country_name id country_code');
    if (!state) {
        throw new ApiError(404, "States not found");
    }

    return res.status(200).json(new ApiResponse(200, state, "State fetched successfully"));
})


export const createState = asyncHandler(async (req, res) => {
    const {state_name, state_code, country_id} = req.body;
    await StateSchema.validateAsync(
        {state_name, state_code, country:country_id, operation: "create"},
        {abortEarly: false},
    );
    const state = await States.create({state_name, state_code, country:country_id});

    const populatedState = await States.findById(state._id).populate('country', 'country_name id country_code');

    return res.status(201).json(new ApiResponse(201, populatedState, "State created successfully"));
});


// update a state
export const updateState = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {state_name, state_code, country_id} = req.body;

    await StateSchema.validateAsync(
        {state_name, state_code, country:country_id, operation: "update"},
        {abortEarly: false},
    );

    const existingState = await States.findOne({_id: id, deleted: {$ne: true}});
    if (!existingState) {
        throw new ApiError(404, "State not found");
    }
    const state = await States.findByIdAndUpdate(
        id,
        {state_name, state_code, country:country_id},
        {new: true},
    );

    const populatedState = await States.findById(state._id).populate('country', 'country_name id country_code');

    return res.status(200).json(new ApiResponse(200, populatedState, "State updated successfully"));
});

// delete a state
export const deleteState = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const existingState = await States.findOne({_id: id, deleted: {$ne: true}});
    if (!existingState) {
        throw new ApiError(404, "State not found");
    }

    await States.delete({_id: id});

    return res.status(200).json(new ApiResponse(200, null, "State deleted successfully"));
});
