import Joi from "joi";
import { Categories } from "../../models/categories.model.js";

const CategorySchema = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  name: value,  isDeleted: false  };
            if (operation === "update") {                
                query._id = { $ne: id }; 
            }
            const existingInd = await Categories.findOne(query);
            
            if (existingInd) {
                throw new Joi.ValidationError("Category with this name already exists", [
                    {
                      message: "Category with this name already exists",
                      path: ["name"],
                      type: "any.invalid",
                      context: { value, label: "name", key: "name" },
                    },
                  ]);
            }
            return value;
        }),
    slug: Joi.string().required()
        .custom((value, helpers) => {
            const lowercaseSlug = value.toLowerCase();            
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lowercaseSlug)) {
                throw new Joi.ValidationError("Slug must be URL-friendly (lowercase, hyphenated words).", [
                    {
                        message: "Slug must be URL-friendly (lowercase, hyphenated words).",
                        path: ["slug"],
                        type: "string.pattern.base",
                        context: { value, label: "slug", key: "slug" },
                    },
                ]);
            }            
            return lowercaseSlug;
        })
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  slug: value,  isDeleted: false  };
            if (operation === "update") {
                query._id = { $ne: id }; 
            }

            const existingInd = await Categories.findOne(query);
            if (existingInd) {
                throw new Joi.ValidationError("Category with this slug already exists", [
                    {
                        message: "Category with this slug already exists",
                        path: ["slug"],
                        type: "any.invalid",
                        context: { value, label: "slug", key: "slug" },
                    },
                ]);
            }
            return value;
        }),

    heading: Joi.string().required(),
    industry_id : Joi.string().required(),
    sr_no: Joi.string().optional().allow('', null)
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { sr_no: value, isDeleted: false };
            if (operation === "update" && value) {
                if (id) {
                    query._id = { $ne: id }; 
                }
                const existingInd = await Categories.findOne(query);
                if (existingInd) {
                    throw new Joi.ValidationError("Category with this sr_no already exists", [
                        {
                            message: "Category with this sr_no already exists",
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

export {  CategorySchema };
