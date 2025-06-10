import {Router} from "express";

import {upload} from "../../middlewares/multer.middleware.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";
import {requireRole} from "../../middlewares/role.middleware.js";

import * as flashScreensController from "../../controllers/app/flashScreens.controller.js";
import * as homeBannersController from "../../controllers/app/homeBanner.controller.js";


import * as userController from "../../controllers/app/user.controller.js";
import * as citiesController from "../../controllers/app/cities.controller.js";

import * as industriesController from "../../controllers/app/industries.controller.js";
import * as categoriesController from "../../controllers/app/categories.controller.js";
import * as subcategoriesController from "../../controllers/app/subcategories.controller.js";
import * as collectionController from "../../controllers/app/collection.controller.js";
import * as brandsController from "../../controllers/app/brands.controller.js";

import * as productController from "../../controllers/app/seller/product.controller.js";
import * as productTypeController from "../../controllers/app/seller/productType.controller.js";
import * as sucategoriesController from "../../controllers/app/seller/subcategories.controller.js";
import * as productSpecificationController from "../../controllers/app/seller/productSpecification.controller.js";


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

const userAuthMiddleware = [verifyJWT, requireRole(["buyer", "seller"])];
router.use(userAuthMiddleware);

router.route("/user").get( userController.getCurrentUser);
router.route("/logout").post( userController.logoutUser);
router.route("/refresh-token").post( userController.refreshAccessToken);


router.post("/assign-seller", userController.assignSellerRole);


const seller = [verifyJWT, requireRole(["seller"])];
// Product APIs
router.get("/seller/products/active" , seller, productController.getActiveProducts);
router.get("/seller/products/deactive" , seller, productController.getInactiveProducts);

router.get("/seller/products/:id" , seller, productController.getProductDetail);
router.post("/seller/products" , seller, productController.createProduct);

router.post("/seller/product/add-categories", seller,  productController.addCategoriesToProduct);
router.post("/seller/product/add-descriptions", seller, productController.addProductDescription);
router.post("/seller/product/add-product-catlog", seller, upload.single("product_catlog"),  productController.addProductCatlog);
router.post("/seller/product/add-product-media", seller, upload.single("product_media"),  productController.addMedia);
router.post("/seller/product/add-video", seller, productController.addVideoUrl);
router.post("/seller/product/deactivate-product", seller, productController.changeProductStatus);


// Product Creation Releted Apis
router.post("/seller/product-types", seller, productTypeController.getAllProductTypes);
router.post("/seller/sub-categories", seller, sucategoriesController.getAllSubCategory);
router.post("/seller/product-specifications", seller, productSpecificationController.getProductSpecifications);
router.get("/seller/product-additional-details", seller, productSpecificationController.getProductAdditionalDetails);


export default router;
