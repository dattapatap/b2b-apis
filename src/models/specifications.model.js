import mongoose from "mongoose";

const specificationSchema = new mongoose.Schema(
    { 
        subcategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategories",
                required: true
            }
        ],

        name: {
            type: String,
            required: true,
            trim: true
        },
        inputType: {
            type: String,
            enum: ["text", "number", "boolean", "select", "multi-select", "radio", "checkbox"],
            required: true
        },
        options: {
            type: [String],
            validate: {
                validator: function (v) {
                    if (["select", "multi-select", "radio", "checkbox"].includes(this.inputType)) {
                        return Array.isArray(v) && v.length > 0;
                    }
                    return true;
                },
                message: props => `${props.path} must have at least one option`
            }
        },
        displayOrder: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

specificationSchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
    }
    next();
});

specificationSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});

export const Specifications = mongoose.model("Specifications", specificationSchema);
