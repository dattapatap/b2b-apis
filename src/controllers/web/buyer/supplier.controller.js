import Joi from "joi";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { User } from "../../../models/user.model.js";
import { CompanyInformation } from "../../../models/companyInformation.model.js";
import { Product } from "../../../models/product.model.js";

export const getsellers = asyncHandler(async (req, res) => {

  const querySchema = Joi.object({
    category: Joi.string().optional(),
    city: Joi.string().optional(),
    verified: Joi.boolean().optional(),
    page: Joi.number().default(1),
    limit: Joi.number().default(10),
  });

  let { category, city, verified, page, limit } = await querySchema.validateAsync(req.query, {
    abortEarly: false,
  });

  const skip = (page - 1) * limit;

  let filter = { roles: "seller" };
  if (verified) filter.isVerified = true;

  let sellers = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .populate({
      path: "business_details", 
      model: CompanyInformation,
      match: city ? { city: new RegExp(city, "i") } : {},
    })
    .lean();

  if (category) {
    const sellerIds = sellers.map((s) => s._id);

    const products = await Product.find({ seller_id: { $in: sellerIds } })
      .populate("category", "name")
      .lean();

    const allowedIds = products
      .filter((p) => p.category?.name?.toLowerCase() === category.toLowerCase())
      .map((p) => p.seller_id.toString());

    sellers = sellers.filter((s) => allowedIds.includes(s._id.toString()));
  }

  const result = sellers.map((s) => ({
    id: s._id,
    company_name: s.business_details?.companyName || s.name,
    city: s.business_details?.city || null,
    verified: s.isVerified || false,
    logo: s.business_details?.logo || null,
    seller_type: s.seller_type || null,
  }));

  return res.status(200).json(new ApiResponse(200, result, "sellers fetched successfully"));
});
