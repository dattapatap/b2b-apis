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




// Seller Contacts Apis 
export const getAllContacts = asyncHandler(async (req, res) => {
    const loggedUser = req.user._id;
    const contacts = await UserContacts.find({  user_id : loggedUser }).sort({ sr_no: 1 }); 
    return res.status(200).json( new ApiResponse( 200, contacts , "Contact fetched successfully") );
});


export const getContactById = asyncHandler(async (req, res) => { 
    const {id} = req.params;
    const contacts = await UserContacts.findById(id).select("-deleted");
    if (!contacts) {
        return res.status(400).json(new ApiError(400, null, "Contact not found"));
    }
    return res.status(200).json(new ApiResponse(200, contacts, "Contact fetched successfully"));
});




export const createContact = asyncHandler(async (req, res) => {
    const { division, contact_person, address, mobile_no, landline_no, toll_free_no, email, fax_no } = req.body;

    const loggedUser = req.user._id;
    
    const schema = Joi.object({
      division: Joi.string().min(3).max(100).required().messages({ "string.empty": "Division is required", "string.min": "Division must be at least 3 characters",}),  
      contact_person: Joi.string().min(3).max(100).required(),  
      address: Joi.object({
        address_line: Joi.string().min(5).max(200).required(),
        landmark: Joi.string().allow(""),
        city: Joi.string().min(2).max(50).required(),
        state: Joi.string().min(2).max(50).required(),
        postal_code: Joi.string().pattern(/^[0-9]{5,10}$/).required(),
        country: Joi.string().min(2).max(50).required(),
      }).required(),
  
      mobile_no: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required() .messages({"string.pattern.base": "Mobile number must be valid"}),
      landline_no: Joi.string().allow(""),
      toll_free_no: Joi.string().allow(""),
      email: Joi.string().email().required().messages({"string.email": "Invalid email format"}),
      fax_no: Joi.string().allow(""),

    });
  
    await schema.validateAsync(req.body, { abortEarly: false });
  
    const session = await mongoose.startSession();
    session.startTransaction();  
    try {
      const lastContact = await UserContacts.findOne({ user_id:loggedUser }).sort({ sr_no: -1 });
      const sr_no = lastContact ? lastContact.sr_no + 1 : 1;
  
      const contact = await UserContacts.create({ user_id:loggedUser,  division, contact_person,  address,  mobile_no,  landline_no, toll_free_no,  email,fax_no, sr_no, });
  
      await session.commitTransaction();
      session.endSession();
  
      return res.status(201).json(new ApiResponse(201, contact , "Contact added successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json(new ApiResponse(500, "Something went wrong", error.message));
    }
    
});




export const updateContact = asyncHandler(async (req, res) => {
    const loggedUser = req.user._id;
    const { id } = req.params;

    // Joi schema for partial update (PATCH)
    const schema = Joi.object({
        division: Joi.string().min(3).max(100).optional(),
        contact_person: Joi.string().min(3).max(100).optional(),
        address: Joi.object({
            address_line: Joi.string().min(5).max(200).optional(),
            landmark: Joi.string().allow("").optional(),
            city: Joi.string().min(2).max(50).optional(),
            state: Joi.string().min(2).max(50).optional(),
            postal_code: Joi.string().pattern(/^[0-9]{5,10}$/).optional(),
            country: Joi.string().min(2).max(50).optional(),
        }).optional(),

        mobile_no: Joi.string().pattern(/^\+?[0-9]{7,15}$/).optional().messages({ "string.pattern.base": "Mobile number must be valid" }),
        landline_no: Joi.string().allow("").optional(),
        toll_free_no: Joi.string().allow("").optional(),
        email: Joi.string().email().optional().messages({ "string.email": "Invalid email format" }),
        fax_no: Joi.string().allow("").optional(),
    });

    await schema.validateAsync(req.body, { abortEarly: false });

    try {
            // Find and update contact
            const updatedContact = await UserContacts.findOneAndUpdate(
            { _id: id, user_id: loggedUser }, 
            { $set: req.body },
            { new: true, runValidators: true }
            );

            if (!updatedContact) {
                return res.status(404).json(new ApiResponse(404, null, "Contact not found"));
            }

            return res.status(200).json(new ApiResponse(200, updatedContact, "Contact updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, error.message));
    }

});

export const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const loggedUser = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid contact id"));
    }

    const contact = await UserContacts.findOneAndDelete({
        _id: id,
        user_id: loggedUser, 
    });

    if (!contact) {
        return res.status(404).json(new ApiResponse(404, null, "Contact not found"));
    }

    return res.status(200).json(new ApiResponse(200, contact, "Contact deleted successfully"));
});


export const reorderContacts = asyncHandler( async ( req, res) =>{
    const { testimonials }  = req.body
    if (!Array.isArray(testimonials)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid testimonials payload"));
    }
    for (const cat of testimonials) {        
        if (!cat.id || typeof cat.sr_no !== 'number') continue;
        await Testimonials.findByIdAndUpdate(cat.id, { sr_no: cat.sr_no});
    }

    const newTestimonials = await Testimonials.find({ deleted: { $ne:true } }).sort({ sr_no: 1 });
    return res.status(200).json(new ApiResponse(200, newTestimonials, "Sr numbers updated"));

});
