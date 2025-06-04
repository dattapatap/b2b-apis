import Joi from "joi";
import { Groups } from "../../models/groups.model.js";

const groupSchema = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = { name: value, isDeleted: false };
            
            if (operation === "update") { query._id = { $ne: id } }
            const existingGroup = await Groups.findOne(query);
            
            if (existingGroup) {
                throw new Joi.ValidationError("Group with this name already exist", [
                    {
                        message: "Group with this name already exist",
                        path: ["name"],
                        type: "any.invalid",
                        context: { value, label: "name", key: "name" },
                    },
                ]);
            }
            return value;
        }),
    description : Joi.string().required(),
    keywords: Joi.array()
        .items( Joi.string().trim().min(1).messages({
                    "string.empty": "Keyword cannot be an empty string",
                })
        ).min(1).unique().required(),   
        
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
});

export { groupSchema };
