import mongoose, { Schema } from "mongoose";

const industrySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        heading: {
            type: String,
            required: false,
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

industrySchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});

industrySchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});

export const Industries = mongoose.model("Industries", industrySchema);
