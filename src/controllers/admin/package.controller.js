import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import { convertSlug } from '../../utils/sluggenrator.js';
import { Package } from "../../models/adminpackage.model.js";


//create package
export const createPackage = asyncHandler(async (req, res) => {
  const { name, price, durationType, durationDays, buyLeads, perBuyLeadPrice, features } = req.body;

  if (!name || !price || !durationDays) {
    throw new ApiError(400, "Name, price, and duration are required");
  }

  const exists = await Package.findOne({ name });
  if (exists) {
    throw new ApiError(400, "Package with this name already exists");
  }

  const newPackage = await Package.create({
    name,
    price,
    durationType,
    durationDays,
    buyLeads,
    perBuyLeadPrice,
    features,
  });

  return res.status(201).json(new ApiResponse(201, newPackage, "Package created successfully"));
});

// all packages
export const getAllPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find({ isActive: true });
  return res.status(200).json(new ApiResponse(200, packages, "Packages fetched successfully"));
});

//Get single package by ID
export const getPackageById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pkg = await Package.findById(id);

  if (!pkg) throw new ApiError(404, "Package not found");

  return res.status(200).json(new ApiResponse(200, pkg, "Package fetched successfully"));
});

// Update package
export const updatePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const pkg = await Package.findByIdAndUpdate(id, data, { new: true });

  if (!pkg) throw new ApiError(404, "Package not found");

  return res.status(200).json(new ApiResponse(200, pkg, "Package updated successfully"));
});

// Delete package (soft delete)
export const deletePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pkg = await Package.findByIdAndUpdate(id, { isActive: false }, { new: true });

  if (!pkg) throw new ApiError(404, "Package not found");

  return res.status(200).json(new ApiResponse(200, pkg, "Package deactivated successfully"));
});
