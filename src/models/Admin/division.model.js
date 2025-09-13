import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const divisionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            default : "Branch Office"
        },   
        sr_no: {
            type: Number,
            required: true,
        },
        status : { type: String, required:true, default: "active"  }
    },
    { timestamps: true }  
);


divisionSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

divisionSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });
export const Divisions = mongoose.model("Divisions", divisionSchema);
