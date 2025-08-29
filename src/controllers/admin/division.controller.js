import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js";


import { Divisions } from "../../models/Admin/division.model.js";
import Joi from "joi";


export const getAll = asyncHandler(async (req, res) => {
    const divisions = await Divisions.find({ deleted: { $ne:true } }).sort({ 'sr_no' : 1});
    return res.status(200).json( new ApiResponse( 200, divisions, "Divisions fetched successfully"));
    
});

// Get a divisions by ID
export const getById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const division = await Divisions.findById(id);
    if (!division) {
        return res.status(400).json(new ApiError(400, null, "Division not found"));
    }
    return res.status(200).json(new ApiResponse(200, division, "Sivision fetched successfully"));
});



// Create a new divisions
export const create = asyncHandler(async (req, res) => {    
    const { name } = req.body;
    const schema = Joi.object({
        name: Joi.string().min(5).max(30).required(),
    });
    await schema.validateAsync({  name }, { abortEarly: false });
    const exists = await Divisions.findOne({ name : name });
    if (exists) {
            return res.status(500).json(new ApiResponse(500, null, "Division name must be unique"));
    }

    const lastdivision  = await Divisions.findOne({ deleted: { $ne: true } }).sort({ sr_no: -1 }).select('sr_no').lean();    
    const sr_no = lastdivision && lastdivision.sr_no ? lastdivision.sr_no + 1 : 1;

    const division = await Divisions.create({ name,  sr_no , status : 'active' });
    return res.status(201).json(new ApiResponse(201, division, "Division added successfully"));

});


// Update a divisions
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    let {name } = req.body;    

    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
    });
    await schema.validateAsync({  name }, { abortEarly: false });

    const division = await Divisions.findOne({ _id: id });
    if (!division) {
        return res.status(404).json(new ApiResponse(404, null, "Division not found"));
    }

    const uniquename = await Divisions.findOne({ name: name, _id :{ $ne : id } });
    if(uniquename){
        return res.status(404).json(new ApiResponse(404, null, "Division name must be unique"));
    }

    // Update the industry fields in the database
    division.name = name || divisions.name;
    await division.save();

    return res.status(200).json(new ApiResponse(200, division, "Division updated successfully"));
   
});


// Delete a city
export const deleteDivision = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const division = await Divisions.findOne({ _id: id });
    if (!division) {
        return res.status(404).json(new ApiResponse(404, null, "division not found or already deleted"));
    }
    await division.delete();
    return res.status(200).json(new ApiResponse(200, division, "division deleted successfully"));
});


export const reorderDivisions  = asyncHandler ( async ( req, res ) => {
    const { divisions }  = req.body
    if (!Array.isArray(divisiona)) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid division payload"));
    }
    for (const cat of divisiona) {        
        if (!cat.id || typeof cat.sr_no !== 'number') continue;
        await Divisions.findByIdAndUpdate(cat.id, { sr_no: cat.sr_no});
    }

    const newDivisions = await Divisions.find({ deleted: { $ne:true } }).sort({ sr_no: 1 });
    return res.status(200).json(new ApiResponse(200, newDivisions, "Sr numbers updated"));
})


export const changeStatus  = asyncHandler ( async ( req, res ) => {
    const { id } = req.params;
    const division = await Divisions.findOne({ _id: id});
    if (!division) {
        return res.status(404).json(new ApiResponse(404, null, "division not found"));
    }
    division.status = division.status === "active" ? "inactive" : "active";
    await division.save();
    return res.status(200).json(new ApiResponse(200, division, "Status toggled successfully"));
})