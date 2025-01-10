import {Router} from "express";
import * as citiesController from "../controllers/cities.controller.js";
import * as industriesController from "../controllers/industries.controller.js";

const router = Router();


router.get("/cities",  citiesController.getAllCities);
router.get("/cities/:id", citiesController.getCityById);

router.get("/industries",  industriesController.getAllIndustry);
router.get("/industries/:id", industriesController.getIndustryById);

export default router;
