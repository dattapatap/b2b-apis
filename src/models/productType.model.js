import mongoose from "mongoose";

const productTypeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true,  trim: true,},
        description: { type: String, required: true,  trim: true,},
        isDeleted: {
            type: Boolean, default: false,
        },

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


export const ProductType = mongoose.model("ProductType", productTypeSchema);

