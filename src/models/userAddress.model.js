import mongoose from "mongoose";
import { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";


const userAddressSchema=new Schema(
{
    
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // link to user

    PinCode: {
            type: Number,
            required: true,
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
        block:{
            type:String,
            required:false
        },
        street:{
            type:String,
            required:false
        },
        landmark:{
            type:String,
            required:false
        }

})
userAddressSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

export const userAddress = mongoose.model("userAddress", userAddressSchema)