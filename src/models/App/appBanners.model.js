import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const AppBannersSchema = new Schema(
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
    },
    { 
        timestamps: true,
        versionKey: false
    }  
);

AppBannersSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});

AppBannersSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

export const AppBanners = mongoose.model("AppBanners", AppBannersSchema);
