import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const stateSchema = new Schema(
    {
        state_name: {
            type: String,
            required: true,
            unique: true,
        },

        state_code: {
            type: String,
            required: true,
            unique: true,
        },
        country_id: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: true,
        },
        // status: {
        //     type: String,
        //     enum: ["active", "inactive"],
        //     default: "active",
        // },
    },
    {timestamps: true},
);

stateSchema.plugin(MongooseDelete, {deleted: true, overrideMethods: "all"});
export const States = mongoose.model("States", stateSchema);
