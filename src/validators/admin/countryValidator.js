import Joi from "joi";
import { Countries } from "../../models/country.model.js";

const CountrySchema = Joi.object({
    country_name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { country_name: value, deleted: { $ne : true } };
            if (operation === "update") {
                query._id = { $ne: id };
            }

            const existingCountry = await Countries.findOne(query);
            if (existingCountry) {
                throw new Joi.ValidationError("Country with this name already exists", [
                    {
                        message: "Country with this name already exists",
                        path: ["country_name"],
                        type: "any.unique"
                    },

                ]);
            }

            return value;
        }),
    country_code: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { country_code: value, deleted: { $ne : true } };
            if (operation === "update") {
                query._id = { $ne: id };
            }
            const existingCountry = await Countries.findOne(query);
            if (existingCountry) {
                throw new Joi.ValidationError("Country with this code already exists", [
                    {
                        message: "Country with this code already exists",
                        path: ["country_code"],
                        type: "any.unique"
                    },
                ]);
            }
            return value;
        }),
    status: Joi.string().valid("active", "inactive")
        .optional().default("active"),
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
});

export { CountrySchema };   