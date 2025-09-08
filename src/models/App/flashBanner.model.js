import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const FlashBannersSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },       
        image: {
            type: String,
        },      
        status: {
            type: String,
            required : true,
        },      
        sr_no: {
            type: Number,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { 
        timestamps: true,
        versionKey: false
    }  
);

FlashBannersSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});


FlashBannersSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });


export const FlashBanner = mongoose.model("FlashBanners", FlashBannersSchema);
