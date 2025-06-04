import Joi from "joi";
import { Brands } from "../../models/brands.model.js";

const BrandSchema = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  name: value,  isDeleted: false  };
            if (operation === "update") {                
                query._id = { $ne: id }; 
            }
            const existingInd = await Brands.findOne(query);
            if (existingInd) {
                throw new Joi.ValidationError("Brand with this name already exists", [
                    {
                      message: "Brand with this name already exists",
                      path: ["name"],
                      type: "any.invalid",
                      context: { value, label: "name", key: "name" },
                    },
                  ]);
            }
            return value;
        }),
    sr_no: Joi.string().optional().allow('', null)
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { sr_no: value, isDeleted: false };
            if (operation === "update" && value) {
                if (id) {
                    query._id = { $ne: id }; 
                }
                const existingInd = await Brands.findOne(query);
                if (existingInd) {
                    throw new Joi.ValidationError("Brand with this sr_no already exists", [
                        {
                            message: "Brand with this sr_no already exists",
                            path: ["sr_no"],
                            type: "any.invalid",
                            context: { value, label: "sr_no", key: "sr_no" },
                        },
                    ]);
                }
            }
            return value;
        }),
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),

});

export {  BrandSchema };
