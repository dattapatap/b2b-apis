import mongoose, { Schema } from "mongoose";

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

AppBannersSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});


export const AppBanners = mongoose.model("AppBanners", AppBannersSchema);
