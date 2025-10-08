import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {Product} from "../../models/product.model.js";
import {ProductMedia} from "../../models/productMedia.model.js";

export const getProductFullView = asyncHandler(async (req, res) => {
    const {id} = req.params;

    // Find the product and populate related fields
    const product = await Product.findById(id)
        .populate({
            path: "media",
            select: "images", // select only necessary fields",
            model: ProductMedia,
        })
        .populate({
            path: "specifications.spec_id",
            select: "name inputType options",
        })
        // .populate({
        //     path: "additional_details.additional_id",
        //     select: "name inputType options",
        // })
        .populate({
            path: "seller_id",
            select: " profile ", // show only these fields
            populate: [
                {path: "business_details"},
                {path: "personal_details"},
                {path: "contacts"},
                {path: "business_card"},
            ],
        })
        .populate("product_unit", "name")
        .populate("category", "name slug")
        .populate("industry", "name slug");

    if (!product) throw new ApiError(404, "Product not found");

    // Format specifications
    const specifications = (product.specifications || []).map((s) => ({
        title: s.spec_id?.name || "Unknown",
        value: s.value,
    }));

    // Format additional details
    // const additionalDetails = (product.additional_details || []).map((d) => ({
    //     title: d.additional_id?.name || d.name || "Unknown",
    //     value: d.value,
    // }));

    const mainImage = product.media?.[0]?.images?.original || null;

    // Seller info
    const sellerInfo = {
        companyName: product.seller_id?.personal_details?.company_name || "",
        logo: product.seller_id?.personal_details?.company_logo || "",
        location: product.seller_id?.contacts?.[0]?.address?.city || "",
        gst: product.seller_id?.business_details?.gstin || "",
        yearsCompleted: product.seller_id?.verifiedYears || 0,
        review: product.seller_id?.rating || {stars: 0, count: 0},
        mobile: product.seller_id?.personal_details?.primary_mobile || "",
        contactSupplier: product.seller_id?.contacts?.[0]?.email || "",
    };

    // Find similar products (same subcategories, excluding current product)
    const similarProducts = await Product.find({
        subcategories: {$in: product.subcategories},
        _id: {$ne: product._id},
        status: "active",
    })
        .limit(6)
        .populate("media")
        .select("name price media slug")
        .lean();

    // Build final response
    const responseData = {
        product: {
            id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            unit: product.product_unit?.name || "Piece",
            description: product.description,
            product_type: product.product_type,
            specifications,
            // additional_details: additionalDetails,
            mainImage,
            brochure: product.media.filter((m) => m.type === "brochure"),
        },
        seller: sellerInfo, // seller info added here
        similarProducts,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Product full view fetched successfully"));
});
