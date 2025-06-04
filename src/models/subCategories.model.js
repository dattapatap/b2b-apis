import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
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
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categories",
            required: true, 
        }, 
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Groups",
            required: true, 
        }, 
        isDeleted: {
            type: Boolean, default: false,
        },

    },
    {timestamps: true},
);

// Pre-save middleware to convert name to lowercase
subCategorySchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});

// Pre-findOneAndUpdate middleware to convert name to lowercase
subCategorySchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});


subCategorySchema.virtual("collections", {
    ref: "Collections", 
    localField: "_id", 
    foreignField: "subcategory", 
    justOne: false, 
});
subCategorySchema.set("toObject", { virtuals: true });
subCategorySchema.set("toJSON", { virtuals: true });




export const SubCategories = mongoose.model("SubCategories", subCategorySchema);
