import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

import {User} from "../../../models/user.model.js";
import { BusinessDetails } from "../../../models/businessDetails.model.js";
import { findSubcategories } from '../../../utils/helper.js';

import Joi from "joi";
import mongoose from "mongoose";
import { Product } from "../../../models/product.model.js";
import slugify from "slugify";
import { SubCategories } from "../../../models/subCategories.model.js";


export const updateCompanyInfo = asyncHandler ( async( req, resp) => {
    const { company_name, gst_no, product_name, product_price, contact_name, whatsapp } = req.body;    
    const loggedUser = req.user._id;
    
    const schema = Joi.object({
        company_name: Joi.string().pattern(/^[a-zA-Z0-9&\- ]{2,100}$/).required()
            .messages({'string.pattern.base': 'Company name must contain only letters, numbers, spaces, & and -', 'string.empty': 'Company name is required',}),
       
        gst_no: Joi.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required()
            .messages({'string.pattern.base': 'GST number format is invalid (e.g. 29AAKCD5205D1ZU)', 'string.empty': 'GST number is required', }),
            
        contact_name: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9&\- ]+$/).required(),
        whatsapp: Joi.string().pattern(/^[6-9][0-9]{9}$/).required().messages({'string.pattern.base': 'Mobile number must be a 10-digit number starting with 6-9'}),
        product_name: Joi.string().min(3).max(100).pattern(/^[a-zA-Z0-9&\- ]{2,100}$/).required(),
        product_price : Joi.number().positive().precision(2).required(),
    });

    await schema.validateAsync({ company_name, gst_no, contact_name, whatsapp, product_name, product_price }, { abortEarly: false });
 
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const user = await User.findById(loggedUser).session(session);
        let businessDetails;
        if (user.business_details) {
            if (businessDetails) {
                businessDetails = await BusinessDetails.findById(user.business_details).session(session);
                businessDetails.company_name = company_name;
                businessDetails.gst_number = gst_no;
                businessDetails.contact_name = contact_name;
                businessDetails.contact_no = whatsapp;
                await businessDetails.save({ session });
            }{
                businessDetails = await BusinessDetails.create([
                    {
                        company_name:company_name,
                        gst_number:gst_no,
                        contact_name:gst_no,   
                        contact_no:whatsapp
                    }
                ], { session });
                user.business_details = businessDetails[0]._id;
                await user.save({ session });
            }
        } else {
            // Create new
            businessDetails = await BusinessDetails.create([
                {
                     company_name:company_name,
                     gst_number:gst_no,
                     contact_name:gst_no,   
                     contact_no:whatsapp
                }
            ], { session });
            user.business_details = businessDetails[0]._id;
            await user.save({ session });
        }
        
        const matchedSubcategories = await findSubcategories(product_name);

        const slug = slugify(product_name, { lower: true }) + "-" + Date.now();
        const productData = {
            name: product_name,
            seller_id : loggedUser,
            slug : slug,
            price : product_price,
        };
    
        // Single Subcategory - Assign to Product
        if (matchedSubcategories.length > 0) {
            productData.subcategories = matchedSubcategories.map(sub => sub._id);
        }else{
            const uncategory =  await SubCategories.findOne({ _id:"684fa86ae994766e539fcef0", name: "Uncategoriesed" }).select('name _id category');
            productData.subcategories = uncategory._id;
        }
    
        const newProduct = new Product(productData);
        await newProduct.save();
    

        await session.commitTransaction();
        session.endSession();

        const updatedUser  = await User.findById(loggedUser).select("-otp -otpExpires -refreshToken -__v -createdAt -updatedAt")
                        .populate({
                                path: 'business_details',
                                select: '-_id -createdAt -updatedAt' 
                            });

        return resp.status(200).json( new ApiResponse(200, updatedUser , "Company information updated successfully.") );
    
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }


})


export const updateContactPerson = asyncHandler ( async( req, resp)=>{
        const { company_name, gst_no } = req.body;    
    const loggedUser = req.user._id;

    
    const schema = Joi.object({
        company_name: Joi.string()
            .regex(/^[a-zA-Z0-9&\- ]{2,100}$/)
            .required()
            .messages({
                'string.pattern.base': 'Company name must contain only letters, numbers, spaces, & and -',
                'string.empty': 'Company name is required',
            }),

        gst_no: Joi.string()
            .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
            .required()
            .messages({
                'string.pattern.base': 'GST number format is invalid (e.g. 29AAKCD5205D1ZU)',
                'string.empty': 'GST number is required',
            }),
    });
    await schema.validateAsync({ company_name, gst_no }, { abortEarly: false });
 
    const session = await mongoose.startSession();
     try {
        session.startTransaction();

        const user = await User.findById(loggedUser).session(session);
        let businessDetails;

        if (user.business_details) {
            // Update existing
            businessDetails = await BusinessDetails.findById(user.business_details).session(session);
            businessDetails.company_name = company_name;
            businessDetails.gst_number = gst_no;
            await businessDetails.save({ session });
        } else {
            // Create new
            businessDetails = await BusinessDetails.create([{ company_name:company_name, gst_number:gst_no,}], { session });
            user.business_details = businessDetails[0]._id;
            await user.save({ session });
        }
        
        await session.commitTransaction();
        session.endSession();

        const updatedUser  = await User.findById(loggedUser).select("-otp -otpExpires -refreshToken -__v -createdAt -updatedAt")
                        .populate({
                                path: 'business_details',
                                select: '-_id -createdAt -updatedAt' 
                            });

        return resp.status(200).json( new ApiResponse(200, updatedUser , "Company information updated successfully.") );
    
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }

})




// export const updateAccountDetails = asyncHandler(async (req, res) => {
//     const {fullName, email} = req.body;

//     if (!fullName || !email) {
//         throw new ApiError(400, "All fields are required");
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set: {
//                 fullName,
//                 email: email,
//             },
//         },
//         {new: true},
//     ).select("-password");

//     return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
// });

// export const updateUserAvatar = asyncHandler(async (req, res) => {
//     const avatarLocalPath = req.file?.path;

//     if (!avatarLocalPath) {
//         throw new ApiError(400, "Avatar file is missing");
//     }
//     const avatar = await uploadOnCloudinary(avatarLocalPath);

//     if (!avatar.url) {
//         throw new ApiError(400, "Error while uploading on avatar");
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set: {
//                 avatar: avatar.url,
//             },
//         },
//         {new: true},
//     ).select("-password");

//     return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"));
// });

// export const updateUserCoverImage = asyncHandler(async (req, res) => {
//     const coverImageLocalPath = req.file?.path;

//     if (!coverImageLocalPath) {
//         throw new ApiError(400, "Cover image file is missing");
//     }

//     //TODO: delete old image - assignment

//     const coverImage = await uploadOnCloudinary(coverImageLocalPath);

//     if (!coverImage.url) {
//         throw new ApiError(400, "Error while uploading on avatar");
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set: {
//                 coverImage: coverImage.url,
//             },
//         },
//         {new: true},
//     ).select("-password");

//     return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
// });

// export const logoutUser = asyncHandler(async (req, res) => {
//     const deviceType = "mobile";

//     await User.findByIdAndUpdate(
//         req.user._id,
//         { $unset: { [`refreshTokens.${deviceType}`]: "" } },
//         { new: true }
//     );

//     const options = {
//         httpOnly: true,
//         secure: true,
//     };

//     return res
//         .status(200)
//         .clearCookie("accessToken", options)
//         .clearCookie("refreshToken", options)
//         .json(new ApiResponse(200, {}, "User logged Out"));
// });
