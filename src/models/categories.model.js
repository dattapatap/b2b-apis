import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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
        heading: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },      
        sr_no: {
            type: Number,
            required: true,
        },       
        industry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Industries",
            required: true, 
        }, 
        isDeleted: {
            type: Boolean, default: false,
        },

    },
    {timestamps: true},
);

// Pre-save middleware to convert name to lowercase
categorySchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});

// Pre-findOneAndUpdate middleware to convert name to lowercase
categorySchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});



categorySchema.virtual("subcategories", {
    ref: "SubCategories", 
    localField: "_id", 
    foreignField: "category", 
    justOne: false, 
});
categorySchema.set("toObject", { virtuals: true });
categorySchema.set("toJSON", { virtuals: true });




export const Categories = mongoose.model("Categories", categorySchema);
