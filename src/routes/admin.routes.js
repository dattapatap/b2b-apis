import {Router} from "express";
import * as adminController from "../controllers/admin/admin.controller.js";
import * as citiesController from "../controllers/admin/cities.controller.js";
import * as industriesController from "../controllers/admin/industries.controller.js";
import * as categoriesController from "../controllers/admin/categories.controller.js";
import * as subcategoriesController from "../controllers/admin/subcategories.controller.js";
import * as brandsController from "../controllers/admin/brands.controller.js";
import * as collectionController from "../controllers/admin/collections.controller.js"
import * as productTypeController from "../controllers/admin/productType.controller.js"
import * as specificationController from "../controllers/admin/specifications.controller.js"
import * as additionalController from "../controllers/admin/additionals.controller.js"
import * as groupsController from "../controllers/admin/groups.controller.js"
import * as appFlashController from "../controllers/admin/App/flashScreen.controller.js"
import * as appBannersController from "../controllers/admin/App/appBanner.controller.js"


import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {requireRole} from "../middlewares/role.middleware.js";

const router = Router();

// Public routes
router.post("/login", upload.none(), adminController.login);
router.post("/forget-password", adminController.forgetPassword);
router.post("/set-password", adminController.setPassword);

// Protected routes
router.post("/logout", verifyJWT, adminController.logoutUser);

const adminAuthMiddleware = [verifyJWT, requireRole(["admin"])];

router.use(adminAuthMiddleware);

router.post("/refresh-token", adminController.refreshAccessToken);
router.get("/user", adminController.getCurrentUser);
router.patch("/update-account", adminController.updateAccountDetails);
router.patch("/avatar", upload.single("avatar"), adminController.updateUserAvatar);



router.get("/cities", citiesController.getAllCities);
router.get("/cities/:id", citiesController.getCityById);
router.post("/cities", upload.single("image"), citiesController.createCity);
router.put("/cities/:id", upload.single("image"), citiesController.updateCity);
router.delete("/cities/:id", citiesController.deleteCity);

router.get("/industries", industriesController.getAllIndustry);
router.get("/industries/:id", industriesController.getIndustryById);
router.post("/industries", upload.single("image"), industriesController.createIndustry);
router.put("/industries/:id", upload.single("image"), industriesController.updateIndustry);
router.delete("/industries/:id", industriesController.deleteIndustry);

router.get("/categories", categoriesController.getAllCategory);
router.get("/categories/:id", categoriesController.getCategoryById);
router.post("/categories", upload.single("image"), categoriesController.createCategory);
router.put("/categories/:id", upload.single("image"), categoriesController.updateCategory);
router.delete("/categories/:id", categoriesController.deleteCategory);

router.get("/sub-categories", subcategoriesController.getAllSubCategory);
router.get("/sub-categories/:id", subcategoriesController.getSubCategoryById);
router.post("/sub-categories", upload.single("image"), subcategoriesController.createSubCategory);
router.put("/sub-categories/:id", upload.single("image"), subcategoriesController.updateSubCategory);
router.delete("/sub-categories/:id", subcategoriesController.deleteSubCategory);

router.get("/brands", brandsController.getAllBrands);
router.get("/brands/:id", brandsController.getBrandById);
router.post("/brands", upload.single("image"), brandsController.createBrand);
router.put("/brands/:id", upload.single("image"), brandsController.updateBrand);
router.delete("/brands/:id", brandsController.deleteBrand);

router.get("/collections", collectionController.getAllCollections);
router.get("/collections/:id", collectionController.getCollectionById);
router.post("/collections", upload.single("image"), collectionController.createCollections);
router.put("/collections/:id", upload.single("image"), collectionController.updateCollections);
router.delete("/collections/:id", collectionController.deleteCollections);

router.get("/product-type", productTypeController.getAllProductTypes);
router.get("/product-type/:id", productTypeController.getProductTypeById);
router.post("/product-type", productTypeController.createProductType);
router.put("/product-type/:id",  productTypeController.updateProductType);
router.delete("/product-type/:id", productTypeController.deleteProductType);

router.get("/specifications", specificationController.getAllSpecifications);
router.get("/specifications/:id", specificationController.getSpecificationById);
router.post("/specifications", specificationController.createSpecifications);
router.put("/specifications/:id", specificationController.updateSpecifications);
router.delete("/specifications/:id", specificationController.deleteSpecification);

router.route("/product-additional-details").get(additionalController.getAllFields).post(additionalController.createFields);
router.route("/product-additional-details/:id").get(additionalController.getFieldById)
                .put(additionalController.updateField).delete(additionalController.deleteField);

router.route("/category-groups").get(groupsController.getAllGroups).post(groupsController.createGroup);
router.route("/category-groups/:id").get(groupsController.getGroupById).put(groupsController.updateGroup).delete(groupsController.deleteGroup);

router.route("/flash-screens").get(appFlashController.getAllFlashBanners).post(upload.single("image"), appFlashController.createFlashBanner);
router.route("/flash-screens/:id").get(appFlashController.getFlashBannerById).put(upload.single("image"), appFlashController.updateFlashBanner).delete(appFlashController.deleteFlashBanner);
router.route("/flash-screens/:id/status").patch(appFlashController.changeFlashBannerStatus);

router.route("/app-banners").get(appBannersController.getAllAppBanners).post(upload.single("image"), appBannersController.createAppBanner);
router.route("/app-banners/:id").get(appBannersController.getAppBannerById).put(upload.single("image"), appBannersController.updateAppBanner).delete(appBannersController.deleteAppBanner);
router.route("/app-banners/:id/status").patch(appBannersController.changeAppBannerStatus);


export default router;
