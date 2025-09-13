import Joi from "joi";
import { ProductType } from "../../models/productType.model.js";

const ProductTypeValicator = Joi.object({
    name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const { id, operation } = helpers.state.ancestors[0];
            const query = {  name: value,  isDeleted: false  };
            if (operation === "update") {                
                query._id = { $ne: id }; 
            }
            const existingInd = await ProductType.findOne(query); 
            if (existingInd) {
                throw new Joi.ValidationError("Product type with this name already exists", [
                    {
                        message: "Product type with this name already exists",
                        path: ["name"],
                        type: "any.invalid",
                        context: { value, label: "name", key: "name" },
                    },
                ]);
            }
            return value;
        }),
    description: Joi.string().required(),  
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
});
export {  ProductTypeValicator };
