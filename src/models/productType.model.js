import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const productTypeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true,  trim: true,},
        description: { type: String, required: true,  trim: true,},
    },     
    { timestamps: true }

);


// Pre-save middleware to convert name to lowercase
productTypeSchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
    }
    next();
});

productTypeSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });
productTypeSchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});

export const ProductType = mongoose.model("ProductType", productTypeSchema);

