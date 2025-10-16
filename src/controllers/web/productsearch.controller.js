import Joi from "joi";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
import { Categories } from "../../models/categories.model.js";
import { SubCategories } from "../../models/subCategories.model.js";
import { Industries } from "../../models/industries.modal.js";

export const searchProducts = asyncHandler(async (req, res) => {
  const { keyword, category, subcategory, city, industry, page = 1, limit = 10, sortBy } = req.query;

  const SearchSchema = Joi.object({
    keyword: Joi.string().optional().allow(""),
    category: Joi.string().optional().allow(""),
    subcategory: Joi.string().optional().allow(""),
    city: Joi.string().optional(),
    industry: Joi.string().optional(),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    sortBy: Joi.string().optional(),
  });

  await SearchSchema.validateAsync(req.query, { abortEarly: false });

  let query = { is_banned: "false" };

  // 🔹 Category name → ObjectId
  if (category) {
    const cat = await Categories.findOne({ name: { $regex: new RegExp(`^${category}$`, "i") } }).lean();
    if (cat) query.category = new mongoose.Types.ObjectId(cat._id);
  }

  // 🔹 Subcategory name → ObjectId
  if (subcategory) {
    const subcat = await SubCategories.findOne({ name: { $regex: new RegExp(`^${subcategory}$`, "i") } }).lean();
    if (subcat) query.subcategory = new mongoose.Types.ObjectId(subcat._id);
  }

  // 🔹 Industry name → ObjectId
  if (industry) {
    const ind = await Industries.findOne({ name: { $regex: new RegExp(`^${industry}$`, "i") } }).lean();
    if (ind) query.industry = new mongoose.Types.ObjectId(ind._id);
  }

  // 🔹 City filter
  if (city) query["seller_id.city"] = { $regex: new RegExp(city, "i") };

  // 🔹 Sort options
  let sortOptions = {};
  if (sortBy === "price_asc") sortOptions.price = 1;
  else if (sortBy === "price_desc") sortOptions.price = -1;
  else if (sortBy === "rating") sortOptions.rating = -1;
  else sortOptions.createdAt = -1;

  const skip = (Number(page) - 1) * Number(limit);

  console.log("🧩 Final Search Query:", query);

  // 🔹 Fetch products
  const products = await Product.find(query)
    .select("-stages -status -additional_details -createdAt -updatedAt -__v -deleted -is_banned")
    .populate("category subcategory seller_id product_unit media industry", "name slug company_name")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Product.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, { total, page: Number(page), totalPages: Math.ceil(total / limit), data: products }, "Products fetched successfully")
  );
});
