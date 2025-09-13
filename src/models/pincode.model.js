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
        city: { type: mongoose.Schema.Types.ObjectId, ref: "Cities", required: true },
        state: { type: mongoose.Schema.Types.ObjectId, ref: "States", required: true },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {timestamps: true},
);


pincodeSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: "all" });
pincodeSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});

export const Pincode = mongoose.model("Pincode", pincodeSchema);