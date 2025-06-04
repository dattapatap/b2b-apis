import Joi from "joi";
import { Collections } from "../../models/collections.model.js";

const CollectionSchema = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  name: value,  isDeleted: false  };
            if (operation === "update") {                
                query._id = { $ne: id }; 
            }
            const existingInd = await Collections.findOne(query);
            
            if (existingInd) {
                throw new Joi.ValidationError("Collection with this name already exists", [
                    {
                      message: "Collection with this name already exists",
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
            
            const existingInd = await Collections.findOne(query);            
            if (existingInd) {
                throw new Joi.ValidationError("Collection with this slug already exists", [
                    {
                        message: "Collection with this slug already exists",
                        path: ["slug"],
                        type: "any.invalid",
                        context: { value, label: "slug", key: "slug" },
                    },
                ]);
            }
            return value;
        }),

    heading: Joi.string().required(),
    industry : Joi.string().required(),
    category : Joi.string().required(),
    sub_category : Joi.string().required(),
    sr_no: Joi.string().optional().allow('', null)
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { sr_no: value, isDeleted: false };
            if (operation === "update" && value) {
                if (id) {
                    query._id = { $ne: id }; 
                }
                const existingInd = await Collections.findOne(query);
                if (existingInd) {
                    throw new Joi.ValidationError("Collection with this sr_no already exists", [
                        {
                            message: "Collection with this sr_no already exists",
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

export {  CollectionSchema };
