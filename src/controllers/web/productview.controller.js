import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "../../models/product.model.js";
import { ProductMedia } from "../../models/productMedia.model.js";

export const getProductFullView = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the product and populate related fields
    const product = await Product.findById(id)
        .populate({
            path: "media",
            select: "images url type metadata",
            model: ProductMedia
        })
        .populate({
            path: "specifications.spec_id",
            select: "name inputType options"
        })
        .populate({
            path: "additional_details.additional_id",
            select: "name inputType options"
        })
        .populate("seller_id", "companyName city state gstNumber verifiedYears rating responseRate isTrustSealVerified mobile email")
        .populate("product_unit", "name")
        .populate("category", "name slug")
        .populate("industry", "name slug");

    if (!product) throw new ApiError(404, "Product not found");

    // Format specifications
    const specifications = (product.specifications || []).map(s => ({
        title: s.spec_id?.name || "Unknown",
        value: s.value
    }));

    // Format additional details
    const additionalDetails = (product.additional_details || []).map(d => ({
        title: d.additional_id?.name || d.name || "Unknown",
        value: d.value
    }));

    // Seller info
    const seller = product.seller_id;
    const sellerData = {
        companyName: seller?.companyName || "",
        location: `${seller?.city || ""}, ${seller?.state || ""}`,
        gstVerified: !!seller?.gstNumber,
        trustSealVerified: !!seller?.isTrustSealVerified,
        yearsInBusiness: seller?.verifiedYears || 0,
        rating: seller?.rating || { stars: 0, count: 0 },
        responseRate: seller?.responseRate || 0,
        contact: {
            mobile: seller?.mobile || null,
            email: seller?.email || null
        }
    };

    // Find similar products (same subcategories, excluding current product)
    const similarProducts = await Product.find({
        subcategories: { $in: product.subcategories },
        _id: { $ne: product._id },
        status: "active"
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
            category: product.category,
            industry: product.industry,
            specifications,
            additional_details: additionalDetails,
            media: product.media 
        },
        seller: sellerData,
        similarProducts
    };

    return res.status(200).json(new ApiResponse(200, responseData, "Product full view fetched successfully"));
});
