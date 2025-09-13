import Joi from "joi";
import { Cities } from "../../models/cities.model.js";

const citySchema = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  name: value,  isDeleted: false  };

            if (operation === "update") {
                query._id = { $ne: id }; 
            }

            const existingCity = await Cities.findOne(query);
            if (existingCity) {
                throw new Joi.ValidationError("City with this name already exists", [
                    {
                      message: "City with this name already exists",
                      path: ["name"],
                      type: "any.invalid",
                      context: { value, label: "name", key: "name" },
                    },
                  ]);
            }
            return value;
        }),
    description: Joi.string().required(),
    state: Joi.string().required(),
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),

});

export {  citySchema };
