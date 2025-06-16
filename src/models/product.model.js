import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        product_id: { type: String,   },
        seller_id: {    required: true,  type: mongoose.Schema.Types.ObjectId,     ref: "User",  },
        name: {       type: String,      required: true,      trim: true,      index: true,   },
        slug: {     type: String,        index: true,     },
        description: {      type: String,     },
        industry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Industries",
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categories",
        },
        subcategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategories",
                required: true,
            },
        ],
        
        status: {
            required: true,
            type: String,
            default: "active",
            index: true,
        },

        price: {required: false, type: Number},

        product_unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductType",
        },

        specifications: [
            {
                spec_id: { type: mongoose.Schema.Types.ObjectId, ref: "Specifications", required: true },
                value: { type: mongoose.Schema.Types.Mixed, required: true },
            }
        ],
        additional_details: [
            {
                additional_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductAdditionals", required: true },
                value: { type: mongoose.Schema.Types.Mixed, required: true },
            }
        ],

        media: [{type: mongoose.Schema.Types.ObjectId, ref: "ProductMedia"}],

        is_banned: {
            type: String,
            default: "false",
        },
        
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true},
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1, category: 1 });

// Capitalize the first letter of each word
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

productSchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeWords(this.name);
    }
    next();
});

productSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = capitalizeWords(update.name);
        this.setUpdate(update);
    }
    next();
});

export const Product = mongoose.model("Products", productSchema);
