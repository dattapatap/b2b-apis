import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import {Groups} from "../../models/groups.model.js";  
import { groupSchema } from "../../validators/admin/groupValidator.js";



export const getAllGroups = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const groups = await Groups.find({ isDeleted: false })
        .skip(skip)
        .limit(limit)
        .select("-isDeleted -__v -createdAt -updatedAt");

    const totalGroups = await Groups.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalGroups / limit);

    return res.status(200).json(
        new ApiResponse(200, {
            groups,
            pagination: {
                currentPage: page,
                totalPages,
                totalGroups,
                limit,
            },
        }, "Groups fetched successfully")
    );
});


export const getGroupById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const group = await Groups.findById(id).select("-isDeleted -__v -createdAt -updatedAt");

    if (!group) {
        throw new ApiError(404, "Group not found");
    }
    return res.status(200).json(new ApiResponse(200, group, "Group fetched successfully"));
});



export const createGroup = asyncHandler(async (req, res) => {
    const { name , description, keywords } = req.body;

    await groupSchema.validateAsync({ name , description, keywords,  operation: "create" },{ abortEarly: false });

    const newGroup = await Groups.create({
        name: name.trim(),
        description,
        keywords: keywords || [],
    });

    return res.status(201).json(new ApiResponse(201, newGroup, "Group created successfully"));   
});


export const updateGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name , description, keywords } = req.body;

    await groupSchema.validateAsync({ id, name, description, keywords, operation: "update"  },{ abortEarly: false });

    const group = await Groups.findOne({ _id: id, isDeleted: false });
    if (!group) { throw new ApiError(404, "Group not found") }

    group.name = name || group.name;
    group.description = description || group.description;
    group.keywords = keywords || group.keywords;
    await group.save();

    return res.status(200).json(new ApiResponse(200, group, "Group updated successfully"));
});


export const deleteGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const group = await Groups.findOne({ _id: id, isDeleted: false });
    if (!group) {
        throw new ApiError(404,  "Group not found or already deleted");
    }

    group.isDeleted = true;
    await group.save();

    return res.status(200).json(new ApiResponse(200, null, "Group deleted successfully"));
});
