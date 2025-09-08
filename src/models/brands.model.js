import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const BrandSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },       
        image: {
            type: String,
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
    { timestamps: true }  
);

BrandSchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});

BrandSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});




BrandSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

BrandSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });


export const Brands = mongoose.model("Brands", BrandSchema);
