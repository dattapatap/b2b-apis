import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {Product} from "../../models/product.model.js";
import {ProductMedia} from "../../models/productMedia.model.js";
// import { CompanyInformation } from "../../models/companyInformation.model.js"
import { UserPersonalDetails } from "../../models/userPersonalDetails.model.js";


export const getProductDetail = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug })
    .populate({
      path: "media",
      select: "images",
      model: ProductMedia,
    })
    .populate("product_unit", "name")
    .populate("subcategories", "name slug heading image")
    .populate({
      path: "seller_id",
      populate: [
        { path: "personal_details" },
        { path: "contacts" },
        { path: "business_card" },
        { path: "business_details" },
      ],
    })
    .populate({
      path: "specifications.spec_id",
      select: "name inputType options",
    })
    .populate({
      path: "additional_details.additional_id",
      select: "name inputType options",
    });

  if (!product) throw new ApiError(404, "Product not found.");

  // Specifications
  const specifications = (product.specifications || []).map((s) => ({
    title: s.spec_id?.name || "Unknown",
    value: s.value,
  }));

  // Additional Details
  const additionalDetails = (product.additional_details || []).map((d) => ({
    title: d.additional_id?.name || d.name || "Unknown",
    value: d.value,
  }));

  // Seller Info
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

  const responseData = {
    product: {
      id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      unit: product.product_unit?.name || "Piece",
      specifications,
      description: product.description,
      subcategories: product.subcategories,
      additionalDetails,
      images: product.media?.map((m) => m.images) || [],
    },
    seller: sellerInfo,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, responseData, "Product details fetched successfully.")
    );
});



export const getCompanyDetails = asyncHandler(async (req, res) => {
    const { userId } = req.params; // /api/web/v1/company/:userId

    const company = await UserPersonalDetails.findOne({ user_id: userId, deleted: false });

    if (!company) {
        return res.status(404).json({
            statusCode: 404,
            success: false,
            message: "Company details not found",
        });
    }

    return res.status(200).json({
        statusCode: 200,
        success: true,
        message: "Company details fetched successfully",
        data: company,
    });
});
