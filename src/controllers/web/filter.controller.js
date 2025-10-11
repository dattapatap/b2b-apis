import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {Product} from "../../models/product.model.js";


export const filterProducts = asyncHandler(async (req, res) => {
    const {minPrice,maxPrice,name,sellerId,category,subcategory,city,sortBy = "createdAt",order = "desc",page = 1,limit = 10,} = req.query;

    const filter = {};

    if (minPrice) filter.price = {...filter.price, $gte: Number(minPrice)};
    if (maxPrice) filter.price = {...filter.price, $lte: Number(maxPrice)};

    if (name) filter.name = {$regex: name, $options: "i"};

    // Seller filter
    if (sellerId) filter.seller_id = sellerId;

    if (category) filter.category_id = category;
    if (subcategory) filter.subcategory_id = subcategory;
    if (city) filter["seller_info.city"] = city;

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;

    // Populate seller info to filter by city
    const products = await Product.find(filter)
        .populate({
            path: "seller_id",
            select: "name city",
            as: "seller_info",
        })
        .sort({[sortBy]: sortOrder})
        .skip(skip)
        .limit(Number(limit))
        .populate(
            "category subcategories seller_id product_unit media industry",
            "name slug  company_name ",
        );

    const total = await Product.countDocuments(filter);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {total, page: Number(page), limit: Number(limit), products},
                "Filtered products fetched successfully",
            ),
        );
});
