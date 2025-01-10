import {Router} from "express";
import {
    login,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateUserAvatar,
    updateAccountDetails,
    forgetPassword,
    setPassword,
} from "../controllers/admin/admin.controller.js";
import * as citiesController from "../controllers/admin/cities.controller.js";
import * as industriesController from "../controllers/admin/industries.controller.js";
import * as categoriesController from "../controllers/admin/categories.controller.js";

import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {requireRole} from "../middlewares/role.middleware.js";

const router = Router();

// Public routes
router.post("/login", upload.none(), login);
router.post("/forget-password", forgetPassword);
router.post("/set-password", setPassword);

// Protected routes
router.post("/logout", verifyJWT, logoutUser);

const adminAuthMiddleware = [verifyJWT, requireRole(["admin"])];
router.use(adminAuthMiddleware);

router.post("/refresh-token", adminAuthMiddleware, refreshAccessToken);
router.get("/current-user", adminAuthMiddleware, getCurrentUser);
router.patch("/update-account", adminAuthMiddleware, updateAccountDetails);
router.patch("/avatar", adminAuthMiddleware, upload.single("avatar"), updateUserAvatar);

router.get("/cities", adminAuthMiddleware, citiesController.getAllCities);
router.get("/cities/:id", adminAuthMiddleware, citiesController.getCityById);
router.post("/cities", upload.single("image"), adminAuthMiddleware, citiesController.createCity);
router.put("/cities/:id", upload.single("image"), adminAuthMiddleware, citiesController.updateCity);
router.delete("/cities/:id", adminAuthMiddleware, citiesController.deleteCity);

router.get("/industries", adminAuthMiddleware, industriesController.getAllIndustry);
router.get("/industries/:id", adminAuthMiddleware, industriesController.getIndustryById);
router.post("/industries", upload.single("image"), adminAuthMiddleware, industriesController.createIndustry);
router.put("/industries/:id", upload.single("image"), adminAuthMiddleware, industriesController.updateIndustry);
router.delete("/industries/:id", adminAuthMiddleware, industriesController.deleteIndustry);

router.get("/categories", adminAuthMiddleware, categoriesController.getAllCategory);
router.get("/categories/:id", adminAuthMiddleware, categoriesController.getCategoryById);
router.post("/categories", upload.single("image"), adminAuthMiddleware, categoriesController.createCategory);
router.put("/categories/:id", upload.single("image"), adminAuthMiddleware, categoriesController.updateCategory);
router.delete("/categories/:id", adminAuthMiddleware, categoriesController.deleteCategory);



export default router;
