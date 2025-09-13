import Joi from "joi";
import { Additionals } from "../../models/additionals.model.js";

const additionalsValidatorSchema = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { name: value, isDeleted: false };
            if (operation === "update") { query._id = { $ne: id } }

            const exist = await Additionals.findOne(query);                        
            if (exist) {
                throw new Joi.ValidationError("Product additional with this name already exist", [
                    {
                        message: "additional with this name already exists",
                        path: ["name"],
                        type: "any.invalid",
                        context: { value, label: "name", key: "name" },
                    },
                ]);
            }
            return value;
        }),

    input_type: Joi.string()
        .valid("text", "number", "boolean", "select", "multi-select", "radio", "checkbox")
        .required(),
    options: Joi.alternatives().try(
        Joi.when("input_type", {
            is: Joi.valid("select", "multi-select", "radio", "checkbox"),
            then: Joi.array().items(Joi.string()).min(1).required(),
            otherwise: Joi.optional().default([])
        })
    ),
    display_order: Joi.number().integer().positive().required(),

    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
    
});

export { additionalsValidatorSchema };
