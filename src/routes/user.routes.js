import {Router} from "express";
import {
    verifyOtp,
    sendOtp,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails,
} from "../controllers/user/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

import * as citiesController from "../controllers/cities.controller.js";

const router = Router();

router.route("/login").post(upload.none(), sendOtp);
router.route("/verify-otp").post(verifyOtp);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);


router.get("/cities",  citiesController.getAllCities);
router.get("/cities/:id", citiesController.getCityById);

export default router;
