import Joi from "joi";
import { Specifications } from "../../models/specifications.model.js";

const specificationsSchema = Joi.object({
    sub_category: Joi.array().items(Joi.string()).min(1).required(),
    name: Joi.string().required()
        .external(async (value, helpers) => {
            const { id, operation, sub_category } = helpers.state.ancestors[0];
            const existingSpec = await Specifications.findOne({
                name: value,
                subcategories: { $in: sub_category },
                isDeleted: false,
                ...(operation === "update" ? { _id: { $ne: id } } : {})
            });
            if (existingSpec) {
                throw new Joi.ValidationError("Specification with this name already exists in one of the selected subcategories", [
                    {
                        message: "Specification with this name already exists in one of the selected subcategories",
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

export { specificationsSchema };
