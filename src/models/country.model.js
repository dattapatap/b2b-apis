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
<<<<<<< HEAD
        status : { type:String, required : true, default : 'active' } 
=======
        country_status: {  type: String, default : "inactive"  },
>>>>>>> development

    },
    { timestamps: true }
);

countrySchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

countrySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: "all" });
countrySchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});

export const Countries = mongoose.model("Countries", countrySchema);
