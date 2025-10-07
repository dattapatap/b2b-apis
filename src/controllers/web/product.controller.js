import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Product } from "../../../models/product.model.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";

export const getAllProducts = asyncHandler(async (req, res) => {
    const {
        category,
        subcategory,
        keyword,
        minPrice,
        maxPrice,
        sellerId,
        sortBy,
        page = 1,
        limit = 12,
    } = req.query;

    const query = { status: "active" };

    if (category) query.category = category;
    if (subcategory) query.subcategories = subcategory;
    if (sellerId) query.seller_id = sellerId;
    if (keyword) query.name = { $regex: keyword, $options: "i" };

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default: newest
    if (sortBy === "price_low") sortOption = { price: 1 };
    if (sortBy === "price_high") sortOption = { price: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
        .populate("media", "images url type metadata")
        .populate("seller_id", "companyName contactName city state country")
        .populate("subcategories", "name slug heading image")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, "Product list fetched successfully.")
    );
});


// 🧩 2️⃣ Get product detail (like IndiaMART product page)
export const getProductDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
        .populate("media", "images url type metadata")
        .populate("subcategories", "name slug heading image")
        .populate("seller_id", "companyName contactName mobile email city state country aboutUs certifications catalogueUrl")
        .lean();

    if (!product) {
        return res.status(404).json(new ApiResponse(404, null, "Product not found"));
    }

    // Fetch related products (same subcategory)
    const relatedProducts = await Product.find({
        subcategories: { $in: product.subcategories },
        _id: { $ne: product._id },
        status: "active",
    })
        .limit(6)
        .populate("media", "images url")
        .populate("seller_id", "companyName city state");

    return res.status(200).json(
        new ApiResponse(200, {
            product,
            relatedProducts,
        }, "Product detail fetched successfully.")
    );
});


// 🧩 3️⃣ Get products by seller (Seller store view)
export const getProductsBySeller = asyncHandler(async (req, res) => {
    const { sellerId } = req.params;

    const products = await Product.find({ seller_id: sellerId, status: "active" })
        .populate("media", "images url type metadata")
        .populate("subcategories", "name slug heading image");

    return res.status(200).json(
        new ApiResponse(200, products, "Seller products fetched successfully.")
    );
});


// 🧩 4️⃣ Search products (like IndiaMART top search bar)
export const searchProducts = asyncHandler(async (req, res) => {
    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json(new ApiResponse(400, null, "Keyword is required"));
    }

    const products = await Product.find({
        status: "active",
        name: { $regex: keyword, $options: "i" },
    })
        .populate("media", "images url")
        .populate("seller_id", "companyName city state");

    return res.status(200).json(new ApiResponse(200, products, "Search results fetched successfully"));
});


// 🧩 5️⃣ Get similar products (for “You may also like” section)
export const getSimilarProducts = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json(new ApiResponse(404, null, "Product not found"));
    }

    const similarProducts = await Product.find({
        subcategories: { $in: product.subcategories },
        _id: { $ne: product._id },
        status: "active",
    })
        .limit(8)
        .populate("media", "images url")
        .populate("seller_id", "companyName city state");

    return res.status(200).json(new ApiResponse(200, similarProducts, "Similar products fetched successfully"));
});
