import Joi from "joi";
import mongoose from "mongoose";
import slugify from "slugify";


import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

import {User} from "../../../models/user.model.js";
import { BusinessDetails } from "../../../models/businessDetails.model.js";

import { Product } from "../../../models/product.model.js";
import { SubCategories } from "../../../models/subCategories.model.js";
import { UserContacts } from "../../../models/userContacts.model.js";


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
        
        const slug = slugify(product_name, { lower: true }) + "-" + Date.now();

        const productData = {
            name: product_name,
            seller_id : loggedUser,
            slug : slug,
            price : product_price,
        };
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
    const { client_name, rating, comment } = req.body;
    const clientFile = req.file;
    const { id } = req.params;

    const schema = Joi.object({
        client_name: Joi.string().min(3).max(50).required(),
        rating: Joi.string().min(1).max(5).required(),
        comment:Joi.string().min(30).max(500).required(),
        image: Joi.object({
            originalname: Joi.string().regex(/\.(jpg|jpeg|png|webp)$/i).required().messages({
                "string.pattern.base": "Only image files are allowed.",
                "any.required": "File name is required."
            }),
            size: Joi.number().max(2 * 1024 * 1024).messages({
                "number.max": "File size should not exceed 2MB."
            })
        }).unknown(true).optional()
    });
    await schema.validateAsync(
        { client_name, rating, comment, ...(clientFile && { image: clientFile })  }, { abortEarly: false }
    );

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const testimonials = await Testimonials.findById(id).session(session);
        if (!testimonials) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json(new ApiResponse(404, null, "Testimonials not found"));
        }

        // Handle image replacement
        let imageUrl = testimonials.image;
        if (clientFile) {
            await deleteLocalFile(testimonials.image);          
            imageUrl = await uploadLocally(clientFile.path, "testimonials");
        }

        // Update fields
        testimonials.client_name = client_name;
        testimonials.rating      = rating;
        testimonials.comment     = comment;
        testimonials.image       = imageUrl;

        await testimonials.save({ session });
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(new ApiResponse(200, testimonials, "Testimonials updated successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json(new ApiResponse(500, null, "Something went wrong",  error.message));
    }

});

export const deleteContact = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const testimonials = await Testimonials.findOne({ _id: id });
    if (!testimonials) {
        return res.status(404).json(new ApiResponse(404, null, "Testimonials not found or already deleted"));
    }
    await testimonials.delete();
    return res.status(200).json(new ApiResponse(200, testimonials, "Testimonials deleted successfully"));
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

})

