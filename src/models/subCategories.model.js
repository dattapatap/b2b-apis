import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

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
        }

    },
    {timestamps: true},
);



function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

subCategorySchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeWords(this.name);
    }
    next();
});




subCategorySchema.virtual("collections", {
    ref: "Collections", 
    localField: "_id", 
    foreignField: "subcategory", 
    justOne: false, 
});

subCategorySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });
subCategorySchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});




export const SubCategories = mongoose.model("SubCategories", subCategorySchema);
