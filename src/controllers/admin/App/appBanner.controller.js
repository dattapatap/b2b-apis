import {asyncHandler} from "../../../utils/asyncHandler.js";
import {ApiError} from "../../../utils/ApiError.js";
import {ApiResponse} from "../../../utils/ApiResponse.js";

import { AppBanners }  from "../../../models/App/appBanners.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../../../utils/cloudinary.js";
import { fileRule } from "../../../rules/fileRules.js";
import Joi from "joi";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const maxFileSize = 2 * 1024 * 1024;


export const getAllAppBanners = asyncHandler(async (req, res) => {
    const appBanners = await AppBanners.find({ isDeleted: false });
    return res.status(200).json( new ApiResponse( 200, { "app_banners" :appBanners }, "App Banners fetched successfully") );
});


// Get a Brand by ID
export const getAppBannerById = asyncHandler(async (req, res) => { 
    const {id} = req.params;
    const banner = await AppBanners.findById(id).select("-isDeleted -createdAt -updatedAt");
    if (!banner) {
        return res.status(400).json(new ApiError(400, null, "App banner not found"));
    }
    return res.status(200).json(new ApiResponse(200, banner, "App Banner fetched successfully"));
});


// Create a new Flash Screen
export const createAppBanner = asyncHandler(async (req, res) => {    
    const { name} = req.body;
    let { sr_no } = req.body;    
    const bannerFile = req.file;

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
    await schema.validateAsync({ name , image: bannerFile }, { abortEarly: false });

    const lastScreen = await AppBanners.findOne({ isDeleted: false }, { sr_no: 1 }).sort({ sr_no: -1 }).lean();
    sr_no = lastScreen?.sr_no ? lastScreen.sr_no + 1 : 1;

    const imageUrl = await uploadOnCloudinary(bannerFile.path, "app-banners");

    const appBanner = await AppBanners.create({ name, image: imageUrl, status : 'active', sr_no });
    return res.status(201).json(new ApiResponse(201, appBanner, "App Banner added successfully"));

});


// Update a Flash Screen
export const updateAppBanner = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, sr_no } = req.body;
    const bannerFile = req.file;

    //Validate name & sr_no
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required(),
        sr_no: Joi.number().integer().min(1).optional()
    });
    await schema.validateAsync({ name, sr_no });

    // Find the flash banner by ID and not deleted
    const appBanner = await AppBanners.findOne({ _id: id, isDeleted: false });
    if (!appBanner) {
        return res.status(404).json(new ApiResponse(404, null, "App Banner not found"));
    }

    let imageUrl;
    if (bannerFile) {
        const fileValidation = fileRule(bannerFile, maxFileSize, allowedExtensions);
        if (!fileValidation.isValid) {
            return res.status(400).json(new ApiResponse(400, null, fileValidation.message));
        }
        if (appBanner.image) {
            await deleteFromCloudinary(appBanner.image);
        }
        imageUrl = await uploadOnCloudinary(bannerFile.path, "app-banners");
    }

    // Update fields
    appBanner.name = name || appBanner.name;
    appBanner.sr_no = sr_no || appBanner.sr_no;
    appBanner.image = imageUrl || appBanner.image;

    await appBanner.save();

    return res.status(200).json(new ApiResponse(200, appBanner, "App Banner updated successfully"));
});


// Delete a Flash Screen
export const deleteAppBanner = asyncHandler(async (req, res) => {
    const {id} = req.params;


    const flash = await AppBanners.findOne({ _id: id, isDeleted: false });
    console.log(flash);
    
    if (!flash) {
        return res.status(404).json(new ApiResponse(404, null, "Banner not found or already deleted"));
    }

    flash.isDeleted = true;
    await flash.save();
    return res.status(200).json(new ApiResponse(200, flash, "App Banner deleted successfully"));

});


// Change Flash Screen status
export const changeAppBannerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appBanner = await AppBanners.findOne({ _id: id, isDeleted: false });
  if (!appBanner) {
    return res.status(404).json(new ApiResponse(404, null, "App Banner not found"));
  }

  appBanner.status = appBanner.status === "active" ? "inactive" : "active";
  await appBanner.save();

  return res.status(200).json(new ApiResponse(200, appBanner, "Status toggled successfully"));
});
