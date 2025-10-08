import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
import { ProductMedia } from "../../models/productMedia.model.js";

export const getProductDetail = asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const loggedInUser = req.user;

    const product = await Product.findOne({ slug })
        .populate({
            path: "media",
            select: "images url type metadata",
            model: ProductMedia,
        })
        .populate("subcategories", "name slug heading image")
        .populate({
            path: "seller_id",
            select: "profile",
            populate: [
                { path: "personal_details" },
                { path: "contacts" },
                { path: "business_card" },
                { path: "business_details" },
            ],
        });

    if (!product) throw new ApiError(404, "Product not found.");

    // 🧩 seller info like IndiaMART
    const sellerInfo = {
        companyName: product.seller_id?.personal_details?.company_name || "",
        logo: product.seller_id?.personal_details?.company_logo || "",
        location: product.seller_id?.contacts?.[0]?.address?.city || "",
        gst: product.seller_id?.business_details?.gstin || "",
        yearsCompleted: product.seller_id?.verifiedYears || 10,
        review: product.seller_id?.rating || { stars: 5, count: 4 },
        mobile: product.seller_id?.personal_details?.primary_mobile || "",
        contactSupplier: product.seller_id?.contacts?.[0]?.email || "",
    };

    // 🧠 Combine product + seller data
    const responseData = {
        product: {
            id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            description: product.description,
            subcategories: product.subcategories,
            media: product.media,
        },
        seller: sellerInfo,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Product details fetched successfully."));
});
