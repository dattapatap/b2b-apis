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
        }
    },
    {   
        timestamps: true,
        toJSON: { virtuals: true, id: false }, 
        toObject: { virtuals: true, id: false }, 
     }  
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


industrySchema.virtual("categories", {
    ref: "Categories", 
    localField: "_id", 
    foreignField: "industry", 
    justOne: false, 
});
industrySchema.set("toObject", { virtuals: true });
industrySchema.set("toJSON", { virtuals: true });



export const Industries = mongoose.model("Industries", industrySchema);
