import mongoose,{Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const pincodeSchema = new Schema(
    {
        pin_code: {
            type: Number,
            required: true,
            unique: true
        },
        zone: {
            type: String,
            required: true
        },
        city: {
            type:Schema.Types.ObjectId,
            ref: "Cities", 
            required: true
        },
        state_id: {
            type: Schema.Types.ObjectId,
            ref: "State",
            required: true
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {timestamps: true},
);


pincodeSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: "all" });

export const Pincode = mongoose.model("Pincode", pincodeSchema);