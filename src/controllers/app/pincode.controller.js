import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";

import Joi from "joi";
import { Pincode } from "../../models/pincode.model.js";
import { States } from "../../models/state.model.js";
import { Countries } from "../../models/country.model.js";
import { Cities } from "../../models/cities.model.js";



export const getPincodeDetails = asyncHandler(async (req, res) => {   
    const schema = Joi.object({
        pincode: Joi.number().min(100000).max(999999).required(),
        country_id: Joi.string().required(),
    });

    const {pincode, country_id } = await schema.validateAsync( req.query, {abortEarly: false});

    // 1. Validate country
    const country = await Countries.findById(country_id);
    if (!country) {
        throw new ApiError(400, "Invalid country selected");
    }

    // 2. Check DB first
    let pincodeDoc = await Pincode.findOne({pin_code: pincode, status: 'active'})
                .select('-createdAt -updatedAt -deleted -status')
                .populate({
                    path: "city",
                    select: "name id state"
                })
                .populate({
                    path: "state",
                    select: "state_name id country_id",
                    populate: {path: "country_id", select: "country_name country_code"},
                });

    if (pincodeDoc) {
        return res.status(200).json(new ApiResponse(200, pincodeDoc, "Pincode fetched successfully"));
    }

    // 3. Call India Post API
    const apiUrl = `https://api.postalpincode.in/pincode/${pincode}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new ApiError(400, "Error fetching data from India Post API");
    }

    const data = await response.json();
    if (!data || data.length === 0 || !data[0].PostOffice) {
        throw new ApiError(400, "No data found for this pincode");
    }

    const postOffices = data[0].PostOffice;
    if (!postOffices || postOffices.length === 0) {
        throw new ApiError(400, "Invalid pincode or no details found");
    }


    const po = postOffices[0];
    const stateName = po.State;
    const cityName = po.District;
    const zone = po.Division || po.Region

    // 5. Ensure State exists
    const state = await States.findOneAndUpdate(
        {state_name: stateName.toUpperCase(), country_id: country.id},
        {state_name: stateName.toUpperCase(), country_id: country.id},
        {new: true, upsert: true},
    );

    // 6. Ensure City exists
    const city = await Cities.findOneAndUpdate(
        {name: cityName, state: state.id},
        {name: cityName, state: state.id},
        {new: true, upsert: true},
    );

    // 7. Create new Pincode
    pincodeDoc = await Pincode.create({ pin_code: pincode, zone, city: city._id,  state: state.id, });

    // 8. Populate before returning
    const populatedDoc = await Pincode.findById(pincodeDoc._id)
        .select('-createdAt -updatedAt -deleted -status')
        .populate({
            path: "city",
            select: "name id state"
        })
        .populate({
            path: "state",
            select: "state_name id country_id",
            populate: {path: "country_id", select: "country_name country_code"},
        });

    return res.status(201).json(new ApiResponse(201, populatedDoc, "Address fetched successfully"));

});
