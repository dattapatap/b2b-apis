import Joi from "joi";
import {States} from "../../models/state.model.js";

export const StateSchema = Joi.object({
    state_name: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const {id, operation} = helpers.state.ancestors[0];
            const query = {state_name: value, deleted: { $ne : true }};
            if (operation === "update") {
                query._id = {$ne: id};
            }

            const existingState = await States.findOne(query);
            if (existingState) {
                throw new Joi.ValidationError("State with this name already exists", [
                    {
                        message: "State with this name already exists",
                        path: ["state_name"],
                        type: "any.unique"
                    },
                ]);
            }

            return value;
        }),
    state_code: Joi.string()
        .required()
        .external(async (value, helpers) => {
            const {id, operation} = helpers.state.ancestors[0];
            const query = {state_code: value, deleted: { $ne : true }};
            if (operation === "update") {
                query._id = {$ne: id};
            }

            const existingState = await States.findOne(query);
            if (existingState) {
                throw new Joi.ValidationError("State with this code already exists", [
                    {
                        message: "State with this code already exists",
                        path: ["state_code"],
                        type: "any.unique"
                    },
                ]);
            }

            return value;
        }),

    country: Joi.string().required(),
    id: Joi.string().optional(),
    operation: Joi.string().valid("create", "update").optional(),
});

