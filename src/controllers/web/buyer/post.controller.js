import Joi from "joi";
import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";
import {Post} from "../../../models/post.model.js";
//create post
export const createPost = asyncHandler(async (req, res) => {
    const {Categories_id,Product_id,title,content} = req.body;
    const buyer_id = req.user._id; // from JWT auth 
    
    const post = await Post.create({
        Categories_id,
        Product_id, 
        buyer_id,
        title,
        content,
    });
    return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});