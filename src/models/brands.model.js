import mongoose, { Schema } from "mongoose";

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

export const Brands = mongoose.model("Brands", BrandSchema);
