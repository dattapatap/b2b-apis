import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Product } from "../../models/product.model.js";
import { ProductMedia } from "../../models/productMedia.model.js";

export const getAllProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, category, search, status } = req.query;

    const query = {};

    // optional filters
    if (status) query.status = status; // active or inactive
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
        .populate({
            path: "media",
            select: "images",
            model: ProductMedia,
        })
        .populate("product_unit", "name")
        .populate("category", "name slug")
        .populate("industry", "name slug")
        .select("name slug price product_unit category industry media description status")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(query);

    if (!products.length) throw new ApiError(404, "No products found");

    const productList = products.map((p) => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: `₹${p.price}`,
        unit: p.product_unit?.name || "Piece",
        image: p.media?.[0]?.images?.original || null,
        category: p.category?.name || "",
        industry: p.industry?.name || "",
        status: p.status || "unknown",
        description: p.description || "",
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                total: totalProducts,
                page: Number(page),
                limit: Number(limit),
                products: productList,
            },
            "Product list fetched successfully"
        )
    );
});
