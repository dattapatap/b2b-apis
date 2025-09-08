import Joi from "joi";
import mongoose from "mongoose";
import slugify from "slugify";

import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import {User} from "../../../models/user.model.js";
import {BusinessDetails} from "../../../models/businessDetails.model.js";
import {UserContacts} from "../../../models/userContacts.model.js";

import {UserPersonalDetails} from "../../../models/userPersonalDetails.model.js";
import {UserBankDetails} from "../../../models/userBank.model.js";
import { UserBussinessCard } from "../../../models/userBusinessCard.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../../../utils/cloudinary.js";
// import {CompanyInformation} from "../../../models/companyInformation.model.js";

export const updateCompanyInfo = asyncHandler(async (req, resp) => {
    const {company_name, gst_no, product_name, product_price, contact_name, whatsapp} = req.body;
    const loggedUser = req.user._id;

    const schema = Joi.object({
        company_name: Joi.string()
            .pattern(/^[a-zA-Z0-9&\- ]{2,100}$/)
            .required()
            .messages({
                "string.pattern.base":
                    "Company name must contain only letters, numbers, spaces, & and -",
                "string.empty": "Company name is required",
            }),

        gst_no: Joi.string()
            .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
            .required()
            .messages({
                "string.pattern.base": "GST number format is invalid (e.g. 29AAKCD5205D1ZU)",
                "string.empty": "GST number is required",
            }),

        contact_name: Joi.string()
            .min(3)
            .max(50)
            .pattern(/^[a-zA-Z0-9&\- ]+$/)
            .required(),
        whatsapp: Joi.string()
            .pattern(/^[6-9][0-9]{9}$/)
            .required()
            .messages({
                "string.pattern.base": "Mobile number must be a 10-digit number starting with 6-9",
            }),
        product_name: Joi.string()
            .min(3)
            .max(100)
            .pattern(/^[a-zA-Z0-9&\- ]{2,100}$/)
            .required(),
        product_price: Joi.number().positive().precision(2).required(),
    });

    await schema.validateAsync(
        {company_name, gst_no, contact_name, whatsapp, product_name, product_price},
        {abortEarly: false},
    );

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const user = await User.findById(loggedUser).session(session);
        let businessDetails;
        if (user.business_details) {
            if (businessDetails) {
                businessDetails = await BusinessDetails.findById(user.business_details).session(
                    session,
                );
                businessDetails.company_name = company_name;
                businessDetails.gst_number = gst_no;
                businessDetails.contact_name = contact_name;
                businessDetails.contact_no = whatsapp;
                await businessDetails.save({session});
            }
            {
                businessDetails = await BusinessDetails.create(
                    [
                        {
                            company_name: company_name,
                            gst_number: gst_no,
                            contact_name: gst_no,
                            contact_no: whatsapp,
                        },
                    ],
                    {session},
                );
                user.business_details = businessDetails[0]._id;
                await user.save({session});
            }
        } else {
            // Create new
            businessDetails = await BusinessDetails.create(
                [
                    {
                        company_name: company_name,
                        gst_number: gst_no,
                        contact_name: gst_no,
                        contact_no: whatsapp,
                    },
                ],
                {session},
            );
            user.business_details = businessDetails[0]._id;
            await user.save({session});
        }

        const slug = slugify(product_name, {lower: true}) + "-" + Date.now();

        const productData = {
            name: product_name,
            seller_id: loggedUser,
            slug: slug,
            price: product_price,
        };
        const newProduct = new Product(productData);
        await newProduct.save();

        await session.commitTransaction();
        session.endSession();

        const updatedUser = await User.findById(loggedUser)
            .select("-otp -otpExpires -refreshToken -__v -createdAt -updatedAt")
            .populate({
                path: "business_details",
                select: "-_id -createdAt -updatedAt",
            });

        return resp
            .status(200)
            .json(new ApiResponse(200, updatedUser, "Company information updated successfully."));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

export const updateContactPerson = asyncHandler(async (req, resp) => {
    const {company_name, gst_no} = req.body;
    const loggedUser = req.user._id;

    const schema = Joi.object({
        company_name: Joi.string()
            .regex(/^[a-zA-Z0-9&\- ]{2,100}$/)
            .required()
            .messages({
                "string.pattern.base":
                    "Company name must contain only letters, numbers, spaces, & and -",
                "string.empty": "Company name is required",
            }),

        gst_no: Joi.string()
            .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
            .required()
            .messages({
                "string.pattern.base": "GST number format is invalid (e.g. 29AAKCD5205D1ZU)",
                "string.empty": "GST number is required",
            }),
    });
    await schema.validateAsync({company_name, gst_no}, {abortEarly: false});

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const user = await User.findById(loggedUser).session(session);
        let businessDetails;

        if (user.business_details) {
            // Update existing
            businessDetails = await BusinessDetails.findById(user.business_details).session(
                session,
            );
            businessDetails.company_name = company_name;
            businessDetails.gst_number = gst_no;
            await businessDetails.save({session});
        } else {
            // Create new
            businessDetails = await BusinessDetails.create(
                [{company_name: company_name, gst_number: gst_no}],
                {session},
            );
            user.business_details = businessDetails[0]._id;
            await user.save({session});
        }

        await session.commitTransaction();
        session.endSession();

        const updatedUser = await User.findById(loggedUser)
            .select("-otp -otpExpires -refreshToken -__v -createdAt -updatedAt")
            .populate({
                path: "business_details",
                select: "-_id -createdAt -updatedAt",
            });

        return resp
            .status(200)
            .json(new ApiResponse(200, updatedUser, "Company information updated successfully."));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});





// Update Bank Details
export const updateBusinessCard = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    if (!req.files || !req.files.front_view || !req.files.back_view) {
        throw new ApiError(400, "Both front_view and back_view files are required");
    }

    const frontFile = req.files.front_view[0];
    const backFile = req.files.back_view[0];

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxFileSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(frontFile.mimetype)) {
        throw new ApiError(422, "Front view must be an image (jpeg, png, jpg, webp)");
    }
    if (!allowedTypes.includes(backFile.mimetype)) {
        throw new ApiError(422, "Back view must be an image (jpeg, png, jpg, webp)");
    }
    if (frontFile.size > maxFileSize || backFile.size > maxFileSize) {
        throw new ApiError(422, "Each file must be less than 2MB");
    }


    // Fetch existing record
    const existingCard = await UserBussinessCard.findOne({ user_id: userId });

    let frontUrl = existingCard?.front_view;
    let backUrl = existingCard?.back_view;
    if (frontFile) {
        if (existingCard?.front_view) {
          await deleteFromCloudinary(existingCard.front_view);
        }
        frontUrl = await uploadOnCloudinary(frontFile.path, "user-business-cards");
    }

    if (backFile) {
      if (existingCard?.back_view) {
        await deleteFromCloudinary(existingCard.back_view);
      }
      backUrl = await uploadOnCloudinary(backFile.path, "user-business-cards");
    }

    if (!frontUrl || !backUrl) {
        throw new ApiError(500, "Failed to upload business card images");
    }

    const bussinessCard = await UserBussinessCard.findOneAndUpdate(
        { user_id: userId },
        { user_id: userId, front_view: frontUrl, back_view: backUrl },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(new ApiResponse(200, bussinessCard, "Business card uploaded successfully"));
});


// Update Bank Details
export const updateBankDetails = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {account_no, account_holder, ifsc_code, branch_name, bank_name} = req.body;

    const BankDetailsSchema = Joi.object({
        account_no: Joi.string().min(9).required(),
        account_holder: Joi.string().optional().allow(""),
        ifsc_code: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
        branch_name: Joi.string().max(50).required(),
        bank_name: Joi.string().max(50).required(),
    });

    await BankDetailsSchema.validateAsync( {account_no, account_holder, ifsc_code, branch_name, bank_name},  {abortEarly: false},  );

    const bankDetails = await UserBankDetails.findOneAndUpdate(
        {user_id: userId}, 
        {user_id: userId, account_no, account_holder, ifsc_code, branch_name, bank_name},
        {new: true, upsert: true},
    );

    return res.status(200).json(new ApiResponse(200, bankDetails, "Bank data saved successfully"));

});
