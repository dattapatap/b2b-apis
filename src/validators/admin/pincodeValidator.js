import Joi from "joi";
import {Pincode} from "../../models/pincode.model.js";

const pincodeSchema = Joi.object({
    pin_code: Joi.number()
        .required()
        .external(async (value, helpers) => {
            const {id, operation} = helpers.state.ancestors[0];
            const query = {pin_code: value, deleted:{ $ne: true }};
            if (operation === "update") {
                query._id = {$ne: id};
            }

            const existingPinCode = await Pincode.findOne(query);
            if (existingPinCode) {
                throw new Joi.ValidationError("PinCode with this code already exists", [
                    {
                        message: "PinCode with this code already exists",
                        path: ["pin_code"],
                        type: "any.unique"
                    },
                ]);
            }

            return value;
        }),
    zone: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
});

export {pincodeSchema};
