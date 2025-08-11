import {Router} from "express";

import {upload} from "../../middlewares/multer.middleware.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";
import {requireRole} from "../../middlewares/role.middleware.js";

import * as flashScreensController from "../../controllers/app/flashScreens.controller.js";
import * as homeBannersController from "../../controllers/app/homeBanner.controller.js";
import * as profileController from "../../controllers/app/seller/profile.controller.js";

import * as userController from "../../controllers/app/user.controller.js";
import * as citiesController from "../../controllers/app/cities.controller.js";

import * as industriesController from "../../controllers/app/industries.controller.js";
import * as categoriesController from "../../controllers/app/categories.controller.js";
import * as subcategoriesController from "../../controllers/app/subcategories.controller.js";
import * as collectionController from "../../controllers/app/collection.controller.js";
import * as brandsController from "../../controllers/app/brands.controller.js";

import * as productController from "../../controllers/app/seller/product.controller.js";
import * as productTypeController from "../../controllers/app/seller/productType.controller.js";
import * as productSpecificationController from "../../controllers/app/seller/productSpecification.controller.js";
import * as industriesSellerController from "../../controllers/app/seller/industries.controller.js";
import * as categoriesSellerController from "../../controllers/app/seller/categories.controller.js";
import * as sucategoriesController from "../../controllers/app/seller/subcategories.controller.js";


const router = Router();

// Public routes
router.get("/flash-screens",  flashScreensController.getScreens);
router.get("/home-banners",  homeBannersController.getBanners);

router.get("/cities",  citiesController.getAllCities);
router.get("/citie/:id", citiesController.getCityById);

router.get("/industries",  industriesController.getAllIndustry);
router.get("/industry/:id", industriesController.getIndustryById);

router.get("/categories",  categoriesController.getAllCategory);
router.get("/category/:id", categoriesController.getCategoryById);

router.get("/sub-categories",  subcategoriesController.getAllSubCategory);
router.get("/sub-category/:id", subcategoriesController.getSubCategoryById);

router.get("/collections",  collectionController.getAllCollections);
router.get("/collection/:id", collectionController.getCollectionById);

router.get("/brands",  brandsController.getAllBrands);
router.get("/brand/:id", brandsController.getBrandById);


router.post("/login", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);

// Authenticated User Routes
router.route("/refresh-token").post( userController.refreshAccessToken);
const userAuthMiddleware = [verifyJWT, requireRole(["buyer", "seller"])];
router.use(userAuthMiddleware);

router.route("/user").get( userController.getCurrentUser);
router.post("/assign-seller", userController.assignSellerRole);
router.route("/logout").post( userController.logoutUser);

// Seller-only routes - Create a sub-router for seller routes
const sellerRouter = Router();
sellerRouter.use(requireRole(["seller"]));

sellerRouter.post("/profile/company-info", profileController.updateCompanyInfo);

// Product APIs
sellerRouter.get("/products/active", productController.getActiveProducts);
sellerRouter.get("/products/deactive", productController.getInactiveProducts);
sellerRouter.get("/products/:id", productController.getProductDetail);

sellerRouter.post("/products", upload.array('images', 10), productController.createProduct);
// Product management routes
sellerRouter.post("/product/add-categories", productController.addSubCategoriesToProduct);

sellerRouter.post("/product/add-descriptions", productController.addProductDescription);
sellerRouter.post("/product/add-product-catlog", upload.single("product_catlog"), productController.addProductCatlog);
sellerRouter.post("/product/add-product-media", upload.single("product_media"), productController.addMedia);
sellerRouter.post("/product/add-video", productController.addVideoUrl);
sellerRouter.post("/product/deactivate-product", productController.changeProductStatus);

// Product creation related APIs
sellerRouter.get("/product-types", productTypeController.getAllProductTypes);
sellerRouter.get("/product-industries", industriesSellerController.getAllIndustry);
sellerRouter.get("/product-categories/:industry", categoriesSellerController.getCategoryByIndustryId);
sellerRouter.get("/product-sub-categories/:category", sucategoriesController.getAllSubsByCategoryId);
sellerRouter.get("/product-specifications", productSpecificationController.getProductSpecifications);
sellerRouter.get("/product-additional-details", productSpecificationController.getProductAdditionalDetails);

// New helper APIs for better product creation flow

sellerRouter.post("/product/suggest-subcategories", productController.getSuggestedSubcategories);

// Mount seller routes under /seller prefix
router.use("/seller", sellerRouter);


export default router;
