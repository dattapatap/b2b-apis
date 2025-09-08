import Joi from "joi";
import { Roles } from "../../models/roles.modal.js";

const RoleValicator = Joi.object({
    role_name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  role_name: value,  isDeleted: false };
            if (operation === "update") {                
                query._id = { $ne: id }; 
            }
            const existingInd = await Roles.findOne(query); 
            if (existingInd) {
                throw new Joi.ValidationError("Role with this name already exists", [
                    {
                        message: "Role with this name already exists",
                        path: ["role_name"],
                        type: "any.invalid",
                        context: { value, label: "role_name", key: "role_name" },
                    },
                ]);
            }
            return value;
        }),
    description: Joi.string().required(),  
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
});
export {  RoleValicator };
