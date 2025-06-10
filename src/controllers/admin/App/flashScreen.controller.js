import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import { FlashBanner }  from "../../../models/App/flashBanner.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../../../utils/cloudinary.js";
import { fileRule } from "../../../rules/fileRules.js";
import Joi from "joi";


const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const maxFileSize = 2 * 1024 * 1024;


export const getAllFlashBanners = asyncHandler(async (req, res) => {
    const flashBanners = await FlashBanner.find({ isDeleted: false });
    return res.status(200).json( new ApiResponse( 200, { "flash_banners" :flashBanners }, "Flash Banners fetched successfully") );
});


// Get a Brand by ID
export const getFlashBannerById = asyncHandler(async (req, res) => { 
    const {id} = req.params;
    const flash = await FlashBanner.findById(id).select("-isDeleted -createdAt -updatedAt");
    if (!flash) {
        return res.status(400).json(new ApiError(400, null, "Flash Screen not found"));
    }
    return res.status(200).json(new ApiResponse(200, flash, "Flash screen fetched successfully"));
});


// Create a new Flash Screen
export const createFlashBanner = asyncHandler(async (req, res) => {    
    const { name} = req.body;
    let { sr_no } = req.body;    
    const flashFile = req.file;

    // Validation Schema
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        image: Joi.object({
            originalname: Joi.string().regex(/\.(jpg|jpeg|png|webp)$/i).required().messages({
                "string.pattern.base": "Only image files are allowed.",
                "any.required": "File name is required."
            }),
            size: Joi.number().max(2 * 1024 * 1024).messages({
                "number.max": "File size should not exceed 2MB."
            })
        }).required().unknown(true)
    });
    await schema.validateAsync({ name , image: flashFile }, { abortEarly: false });

    const lastScreen = await FlashBanner.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
    sr_no = lastScreen?.sr_no ? lastScreen.sr_no + 1 : 1;

    const imageUrl = await uploadOnCloudinary(flashFile.path, "flash-screens");

    const flashScreen = await FlashBanner.create({ name, image: imageUrl, status : 'active', sr_no });
    return res.status(201).json(new ApiResponse(201, flashScreen, "Flash Screen added successfully"));

});


// Update a Flash Screen
export const updateFlashBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, sr_no } = req.body;
    const flashFile = req.file;

    //Validate name & sr_no
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        sr_no: Joi.number().integer().min(1).optional()
    });
    await schema.validateAsync({ name, sr_no });

    // Find the flash banner by ID and not deleted
    const flashBanner = await FlashBanner.findOne({ _id: id, isDeleted: false });
    if (!flashBanner) {
        return res.status(404).json(new ApiResponse(404, null, "Flash Banner not found"));
    }

    let imageUrl;
    if (flashFile) {
        const fileValidation = fileRule(flashFile, maxFileSize, allowedExtensions);
        if (!fileValidation.isValid) {
            return res.status(400).json(new ApiResponse(400, null, fileValidation.message));
        }
        if (flashBanner.image) {
            await deleteFromCloudinary(flashBanner.image);
        }
        imageUrl = await uploadOnCloudinary(flashFile.path, "flash-screens");
    }

    // Update fields
    flashBanner.name = name || flashBanner.name;
    flashBanner.sr_no = sr_no || flashBanner.sr_no;
    flashBanner.image = imageUrl || flashBanner.image;

    await flashBanner.save();

    return res.status(200).json(new ApiResponse(200, flashBanner, "Flash screen updated successfully"));
});


// Delete a Flash Screen
export const deleteFlashBanner = asyncHandler(async (req, res) => {
    const {id} = req.params;


    const flash = await FlashBanner.findOne({ _id: id, isDeleted: false });
    console.log(flash);
    
    if (!flash) {
        return res.status(404).json(new ApiResponse(404, null, "Flash Scheen not found or already deleted"));
    }

    flash.isDeleted = true;
    await flash.save();
    return res.status(200).json(new ApiResponse(200, flash, "Flash Screen deleted successfully"));

});


// Change Flash Screen status
export const changeFlashBannerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const flashBanner = await FlashBanner.findOne({ _id: id, isDeleted: false });
  if (!flashBanner) {
    return res.status(404).json(new ApiResponse(404, null, "Flash Screen not found"));
  }

  flashBanner.status = flashBanner.status === "active" ? "inactive" : "active";
  await flashBanner.save();

  return res.status(200).json(new ApiResponse(200, flashBanner, "Status changed successfully"));
});
