import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
import { Categories } from "../../models/categories.model.js";
import { SubCategories } from "../../models/subCategories.model.js";

export const filterProducts = asyncHandler(async (req, res) => {
  const {category,subcategory,city,sortBy = "createdAt", order = "desc",page = 1,limit = 10,} = req.query;

  const filter = {};

if (category) {
    const cat = await Categories.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") }, 
    });
    if (cat) filter.category = cat._id;
  }

  // Convert subcategory name → _id
  if (subcategory) {
    const subcat = await SubCategories.findOne({
      name: { $regex: new RegExp(`^${subcategory}$`, "i") },
    });
    if (subcat) filter.subcategory = subcat._id;
  }



  const skip = (Number(page) - 1) * Number(limit);
  const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;

  console.log(" Final filter used:", filter);

  let products = await Product.find(filter)
    .populate({
      path: "seller_id",
      select: "name city",
      match: city ? { city: { $regex: new RegExp(city, "i") } } : {},
    })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(Number(limit))
    .populate("category subcategories seller_id product_unit media industry", "name slug company_name")
    .lean();

  products = products.filter((p) => p.seller_id !== null);

  console.log("Products found:", products.length);

  const total = products.length;

  return res.status(200).json(
    new ApiResponse(
      200,
      { total, page: Number(page), limit: Number(limit), products },
      "Filtered products fetched successfully"
    )
  );
});
