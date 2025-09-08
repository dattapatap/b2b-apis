import Joi from "joi";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { UserPersonalDetails } from "../../../models/userPersonalDetails.model.js";
import { UserBankDetails } from "../../../models/userBankDetails.model.js";
import {CompanyInformation} from "../../../models/companyInformation.model.js";
import { userAddress } from "../../../models/userAddress.model.js";




// Joi schema with ALL fields required
const PersonalDetailsSchema = Joi.object({
  company_name: Joi.string().min(2).max(100).required(),
  contact_person: Joi.string().min(2).max(100).required(),
  designation: Joi.string().min(2).max(100).required(),

  primary_mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  primary_email: Joi.string().email().required(),

  alt_mobile: Joi.string().pattern(/^[0-9]{10}$/),
  landline_no: Joi.string().optional(),

  pincode: Joi.string().optional(),
  city: Joi.string().optional(),
  district: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
  floor: Joi.string().optional(),
  area_street: Joi.string().optional(),
  locality: Joi.string().optional(),
  landmark: Joi.string().optional(),

  catalog_url: Joi.string().uri(),
  website_url: Joi.string().uri().optional(),
  google_business_url: Joi.string().uri().optional(),
  facebook_url: Joi.string().uri().optional(),
  map_url: Joi.string().uri().optional(),
  company_logo: Joi.string().optional(),
});


export const upsertPersonalDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // from auth middleware

  if (!userId) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Unauthorized: user not logged in"));
  }

  try {
    // Validate input
    await PersonalDetailsSchema.validateAsync(req.body, { abortEarly: false });

    // Update if exists, else create
    const personal = await UserPersonalDetails.findOneAndUpdate(
      { user: userId, deleted: { $ne: true } },
      { user: userId, ...req.body },
      { new: true, upsert: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, personal, "Personal details saved successfully"));
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          error.details.map((d) => d.message)
        )
      );
    }
    return res.status(500).json(new ApiError(500, error.message));
  }
});

const BankDetailsSchema = Joi.object({
  account_no: Joi.string().min(6).required(),
  account_holder: Joi.string().optional().allow(""),
  ifsc_code: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
  branch_name: Joi.string().required(),
  bank_name: Joi.string().required(),
});

//  Create or Update Bank Details for logged-in user
export const upsertUserBankDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // from auth middleware
  const { account_no, account_holder, ifsc_code, branch_name, bank_name } = req.query;

  if (!userId) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Unauthorized: user not logged in"));
  }

  try {
    // Validate request body
    await BankDetailsSchema.validateAsync(
      { account_no, account_holder, ifsc_code, branch_name, bank_name },
      { abortEarly: false }
    );

    // Update if exists, else create new
    const bankDetails = await UserBankDetails.findOneAndUpdate(
      { user: userId, deleted: { $ne: true } }, // find existing details
      { user: userId, account_no, account_holder, ifsc_code, branch_name, bank_name },
      { new: true, upsert: true } // upsert = update or insert
    );

    return res
      .status(200)
      .json(new ApiResponse(200, bankDetails, "Bank details saved successfully"));
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          error.details.map((d) => d.message)
        )
      );
    }
    console.error("UserBankDetails Error:", error);
    return res.status(500).json(new ApiError(500, error.message));
  }
});



// Joi schema
const CompanyInformationSchema = Joi.object({
    companyName: Joi.string().min(2).max(100).required(),
    website: Joi.string().uri().required(),
    GSTIN: Joi.string()
        .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .required(),
    PAN: Joi.string()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .required(),
});

//  Create or Update company info for logged-in user
export const updateCompanyInformation = asyncHandler(async (req, res) => {
    const userId = req.user?._id; // from auth middleware
    const {companyName, website, GSTIN, PAN} = req.body;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, "Unauthorized: user not logged in"));
    }

    try {
        // Validate request
        await CompanyInformationSchema.validateAsync(
            {companyName, website, GSTIN, PAN},
            {abortEarly: false},
        );

        // Update if exists, else create new
        const info = await CompanyInformation.findOneAndUpdate(
            {user: userId, deleted: {$ne: true}},
            {user: userId, companyName, website, GSTIN, PAN},
            {new: true, upsert: true}, // upsert = update if found, else insert
        );

        return res
            .status(200)
            .json(new ApiResponse(200, info, "Company information saved successfully"));
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    error.details.map((d) => d.message),
                ),
            );
        }
        return res.status(500).json(new ApiError(500, error.message));
    }
});



// Joi schema for validation
const AddressSchema = Joi.object({
  PinCode: Joi.number().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  block: Joi.string().optional().allow(""),
  street: Joi.string().optional().allow(""),
  landmark: Joi.string().optional(),
});

// Create or Update address info for logged-in user
export const upsertUserAddress = asyncHandler(async (req, res) => {
  const userId = req.user?._id; // from auth middleware
  const { PinCode, city, state, country, block, street, landmark } = req.body;

  if (!userId) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Unauthorized: user not logged in"));
  }

  try {
    // Validate request
    await AddressSchema.validateAsync(
      { PinCode, city, state, country, block, street, landmark },
      { abortEarly: false }
    );

    // Update if exists, else create new
    const address = await userAddress.findOneAndUpdate(
      { user: userId, deleted: { $ne: true } },
      { user: userId, PinCode, city, state, country, block, street, landmark },
      { new: true, upsert: true } // upsert = update or insert
    );

    return res
      .status(200)
      .json(new ApiResponse(200, address, "Address information saved successfully"));
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          error.details.map((d) => d.message)
        )
      );
    }
    return res.status(500).json(new ApiError(500, error.message));
  }
});
