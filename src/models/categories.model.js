import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

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
    },
    {timestamps: true},
);

function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Pre-save middleware to convert name to lowercase
categorySchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeWords(this.name);
    }
    next();
});



categorySchema.virtual("subcategories", {
    ref: "SubCategories", 
    localField: "_id", 
    foreignField: "category", 
    justOne: false, 
});

categorySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

categorySchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});


export const Categories = mongoose.model("Categories", categorySchema);
