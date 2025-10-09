import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
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
        .populate({
            path: "seller_id",
            populate: [
                { path: "business_details" },
                { path: "personal_details" },
                { path: "contacts" },
                { path: "business_card" },
            ],
        })
        .populate("product_unit", "name")
        .populate("category", "name slug")
        .populate("industry", "name slug")
        .populate({
            path: "specifications.spec_id",
            select: "name inputType options",
        })
        .select("name slug price product_unit category industry media description status seller_id specifications")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(query);

    const productList = products.map((p) => {
        const seller = p.seller_id;

        const sellerInfo = {
            companyName: seller?.personal_details?.company_name || "",
            logo: seller?.personal_details?.company_logo || "",
            location: seller?.contacts?.[0]?.address?.city || "",
            gst: seller?.business_details?.gstin || "",
            yearsCompleted: seller?.verifiedYears || 10,
            review: seller?.rating || { stars: 5, count: 4 },
            mobile: seller?.personal_details?.primary_mobile || "",
            contactSupplier: seller?.contacts?.[0]?.email || "",
        };

        // Format specifications
        const specifications = (p.specifications || []).map((s) => ({
            title: s.spec_id?.name || "Unknown",
            value: s.value,
        }));

        return {
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
            specifications, // add specifications
            seller: sellerInfo, // add seller info
        };
    });

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
