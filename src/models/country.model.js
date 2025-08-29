import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const countrySchema = new Schema(
    {
        country_name: {
            type: String,
            required: true,
        },
        country_icon: {
            type: String,
            required: false
        },
        country_code: {
            type: String,
            required: true,
            unique: true
        },

    },
    { timestamps: true }
);

countrySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: "all" });

export const Countries = mongoose.model("Countries", countrySchema);
