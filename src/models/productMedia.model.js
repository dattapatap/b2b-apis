import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Products",
            required: true,
        },
        type: {
            type: String,
            enum: ["image", "video", "pdf"],
            required: true,
        },
        url: {
            type: String,
            required: function () {
                return this.type !== "image";
            },
        },
        images: {
            original: { type: String },
            sizes: {
                "100x100": { type: String },
                "250x250": { type: String },
                "500x500": { type: String },
                "1000x1000": { type: String },
            },
        },   
        metadata: {
            size_in_kb: Number,
            format: String,
            resolution: String,
        },        
    },
    {timestamps: true},
);

export const ProductMedia = mongoose.model("ProductMedia", mediaSchema);