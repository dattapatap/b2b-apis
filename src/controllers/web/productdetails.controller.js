import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {Product} from "../../models/product.model.js";
import {ProductMedia} from "../../models/productMedia.model.js";

export const getProductDetail = asyncHandler(async (req, res) => {
    const slug = req.params.slug;

    const product = await Product.findOne({slug})
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
                {path: "personal_details"},
                {path: "contacts"},
                {path: "business_card"},
                {path: "business_details"},
            ],
        })
         .populate({
            path: "specifications.spec_id",
            select: "name inputType options",
        })
        .populate({
            path: "additional_details.additional_id",
            select: "name inputType options"
        })
        ;

    if (!product) throw new ApiError(404, "Product not found.");

    const specifications = (product.specifications || []).map((s) => ({
        title: s.spec_id?.name || "Unknown",
        value: s.value,
    }));

    const additionalDetails = (product.additional_details || []).map(d => ({
        title: d.additional_id?.name || d.name || "Unknown",
        value: d.value
    }));
    

    const sellerInfo = {
        companyName: product.seller_id?.personal_details?.company_name || "",
        logo: product.seller_id?.personal_details?.company_logo || "",
        location: product.seller_id?.contacts?.[0]?.address?.city || "",
        gst: product.seller_id?.business_details?.gstin || "",
        yearsCompleted: product.seller_id?.verifiedYears || 10,
        review: product.seller_id?.rating || {stars: 5, count: 4},
        mobile: product.seller_id?.personal_details?.primary_mobile || "",
        contactSupplier: product.seller_id?.contacts?.[0]?.email || "",
    };

    const responseData = {
        product: {
            id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            specifications,
            description: product.description,
            subcategories: product.subcategories,
            additionalDetails,
            media: product.media,
        },
        seller: sellerInfo,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, responseData, "Product details fetched successfully."));
});
