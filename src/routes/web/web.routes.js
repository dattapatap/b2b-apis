import {Router} from "express";


import {upload} from "../../middlewares/multer.middleware.js";
import {verifyJWT} from "../../middlewares/auth.middleware.js";
import {requireRole} from "../../middlewares/role.middleware.js";

import * as userController from "../../controllers/web/user.controller.js";
import * as citiesController from "../../controllers/web/cities.controller.js";
import * as industriesController from "../../controllers/web/industries.controller.js";
import * as categoriesController from "../../controllers/web/categories.controller.js";
import * as subcategoriesController from "../../controllers/web/subcategories.controller.js";
import * as collectionController from "../../controllers/web/collection.controller.js";
import * as brandsController from "../../controllers/web/brands.controller.js";
import * as ProfileController from "../../controllers/web/buyer/profile.controller.js";
import * as productController from "../../controllers/web/seller/product.controller.js";


const router = Router();


// Public routes
router.post("/login", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);


const adminAuthMiddleware = [verifyJWT, requireRole(["buyer", "seller"])];
router.use(adminAuthMiddleware);

router.route("/refresh-token").post( userController.refreshAccessToken);
router.route("/user").get(userController.getCurrentUser);
router.route("/logout").post(  userController.logoutUser);


// Product APIs
router.route("/buyer/product/create").post( productController.createProduct);
router.route("/buyer/product/add-categories").post( productController.addCategoriesToProduct);
router.route("/buyer/product/add-product-catlog").post( upload.single("product_catlog"),  productController.addProductCatlog);
router.route("/buyer/product/add-product-media").post( upload.single("product_media"),  productController.addMedia);
router.route("/buyer/product/add-video").post( productController.addVideoUrl);




router.get("/cities",  citiesController.getAllCities);
router.get("/citie/:id", citiesController.getCityById);

router.get("/industries",  industriesController.getAllIndustry);
router.get("/industries-with-collections/:id",  industriesController.getAllIndustryWithCollections);
router.get("/industry/:slug", industriesController.getIndustryDetails);

router.get("/categories",  categoriesController.getAllCategory);
router.get("/category/:slug", categoriesController.getCategoryDetails);

router.get("/sub-categories",  subcategoriesController.getAllSubCategory);
router.get("/sub-category/:id", subcategoriesController.getSubCategoryById);

router.get("/collections",  collectionController.getAllCollections);
router.get("/collection/:id", collectionController.getCollectionById);

router.get("/brands",  brandsController.getAllBrands);
router.get("/brand/:id", brandsController.getBrandById);


//Buyer personal information
router.route("/buyer/personal-info").put(ProfileController.upsertPersonalDetails);

//company info  
router.route("/buyer/company-info").put( ProfileController.updateCompanyInformation);


// Buyer Bank Details
router.route("/buyer/bankdetails").put( ProfileController.upsertUserBankDetails);    

//Buyer Address
router.route("/buyer/address-info").put(ProfileController.upsertUserAddress);



export default router;
