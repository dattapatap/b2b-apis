import {Router} from "express";
import * as adminController from "../controllers/admin/admin.controller.js";
import * as industriesController from "../controllers/admin/industries.controller.js";
import * as categoriesController from "../controllers/admin/categories.controller.js";
import * as subcategoriesController from "../controllers/admin/subcategories.controller.js";
import * as brandsController from "../controllers/admin/brands.controller.js";
import * as collectionController from "../controllers/admin/collections.controller.js"
import * as productTypeController from "../controllers/admin/productType.controller.js"
import * as specificationController from "../controllers/admin/specifications.controller.js"
import * as additionalController from "../controllers/admin/additionals.controller.js"
import * as groupsController from "../controllers/admin/groups.controller.js"
import * as divisionController from "../controllers/admin/division.controller.js"
import * as appFlashController from "../controllers/admin/App/flashScreen.controller.js"
import * as appBannersController from "../controllers/admin/App/appBanner.controller.js"


// Relational Controllers
import * as countryController from "../controllers/admin/Relational/country.controller.js"
import * as stateController from "../controllers/admin/Relational/state.controller.js"
import * as citiesController from "../controllers/admin/Relational/cities.controller.js"
import * as pincodeController from "../controllers/admin/Relational/pincode.controller.js"


import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/authAdmin.middleware.js";
import {requireRole} from "../middlewares/adminRole.middleware.js";

const router = Router();

// Public routes
router.post("/sign-in", adminController.login);
router.post("/forget-password", adminController.forgetPassword);
router.post("/set-password", adminController.setPassword);

// Protected routes

router.post("/refresh-token", adminController.refreshAccessToken);
const adminAuthMiddleware = [verifyJWT, requireRole(["admin"])];

router.use(adminAuthMiddleware);
router.post("/sign-out", verifyJWT, adminController.logoutUser);

router.get("/user", adminController.getCurrentUser);
router.patch("/avatar", upload.single("avatar"), adminController.updateUserAvatar);



//Country Routes
router.route("/relational/country").get(countryController.getAllCountry).post(upload.single("country_icon"), countryController.createCountry);
router.route("/relational/country/:id").get(countryController.getCountryById).patch(upload.single("country_icon"), countryController.updateCountry).delete(countryController.deleteCountry);

//state Routes
router.route("/relational/state").get(stateController.getAll).post(stateController.createState);
router.route("/relational/state/:id").get(stateController.getStateById).patch(stateController.updateState).delete( stateController.deleteState);

// cities
router.route("/relational/cities").get(citiesController.getAllCities).post(upload.single("image"), citiesController.createCity);
router.route("/relational/cities/:id").get(citiesController.getCityById).patch(upload.single("image"), citiesController.updateCity).delete(citiesController.deleteCity);

// Pincode Routes
router.route("/relational/pincode").post(pincodeController.createPinCode).get(pincodeController.getAllPinCode);
router.route("/relational/pincode/:id").get(pincodeController.getPinCodeById).patch(pincodeController.updatePinCode).delete(pincodeController.deletePinCode);
router.route("/relational/pincode/:id/status").patch(pincodeController.updatePinCodeStatus);

// INDUSTRIES 
router.route("/industries").get(industriesController.getAllIndustry).post(upload.single("icon"), industriesController.createIndustry);
router.route("/industries/:id").get(industriesController.getIndustryById).put(upload.single("icon"), industriesController.updateIndustry).delete(industriesController.deleteIndustry);

// CATEGORIES 
router.route("/categories").get(categoriesController.getAllCategory).post(upload.single("icon"), categoriesController.createCategory);
router.route("/categories/:id").get(categoriesController.getCategoryById).put(upload.single("icon"), categoriesController.updateCategory).delete(categoriesController.deleteCategory);

//SUB-CATEGORIES 
router.route("/sub-categories").get(subcategoriesController.getAllSubCategory).post(upload.single("icon"), subcategoriesController.createSubCategory);
router.route("/sub-categories/:id").get(subcategoriesController.getSubCategoryById).put(upload.single("icon"), subcategoriesController.updateSubCategory).delete(subcategoriesController.deleteSubCategory);

//  BRANDS 
router.route("/brands").get(brandsController.getAllBrands).post(upload.single("icon"), brandsController.createBrand);
router.route("/brands/:id").get(brandsController.getBrandById).put(upload.single("icon"), brandsController.updateBrand).delete(brandsController.deleteBrand);

//  COLLECTIONS 
router.route("/collections").get(collectionController.getAllCollections).post(upload.single("icon"), collectionController.createCollections);
router.route("/collections/:id").get(collectionController.getCollectionById).put(upload.single("icon"), collectionController.updateCollections).delete(collectionController.deleteCollections);

//  PRODUCT TYPES 
router.route("/product-type").get(productTypeController.getAllProductTypes).post(productTypeController.createProductType);
router.route("/product-type/:id").get(productTypeController.getProductTypeById).put(productTypeController.updateProductType).delete(productTypeController.deleteProductType);

//  SPECIFICATIONS 
router.route("/specifications").get(specificationController.getAllSpecifications).post(specificationController.createSpecifications);
router.route("/specifications/:id").get(specificationController.getSpecificationById).put(specificationController.updateSpecifications).delete(specificationController.deleteSpecification);

router.route("/product-additional-details").get(additionalController.getAllFields).post(additionalController.createFields);
router.route("/product-additional-details/:id").get(additionalController.getFieldById).put(additionalController.updateField).delete(additionalController.deleteField);

router.route("/category-groups").get(groupsController.getAllGroups).post(groupsController.createGroup);
router.route("/category-groups/:id").get(groupsController.getGroupById).put(groupsController.updateGroup).delete(groupsController.deleteGroup);

router.route("/flash-screens").get(appFlashController.getAllFlashBanners).post(upload.single("image"), appFlashController.createFlashBanner);
router.route("/flash-screens/:id").get(appFlashController.getFlashBannerById).put(upload.single("image"), appFlashController.updateFlashBanner).delete(appFlashController.deleteFlashBanner);
router.route("/flash-screens/:id/status").patch(appFlashController.changeFlashBannerStatus);

router.route("/app-banners").get(appBannersController.getAllAppBanners).post(upload.single("image"), appBannersController.createAppBanner);
router.route("/app-banners/:id").get(appBannersController.getAppBannerById).put(upload.single("image"), appBannersController.updateAppBanner).delete(appBannersController.deleteAppBanner);
router.route("/app-banners/:id/status").patch(appBannersController.changeAppBannerStatus);


// Relational Apis
router.route("/relational/divisions").get(divisionController.getAll).post(divisionController.create);
router.route("/relational/divisions/:id").get(divisionController.getById).put(upload.single("image"), divisionController.update).delete(divisionController.deleteDivision);
router.route("/relational/divisions/:id/status").patch(divisionController.changeStatus);
router.route("/relational/divisions/reorder").patch(divisionController.reorderDivisions);


export default router;
