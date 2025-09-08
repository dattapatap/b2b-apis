import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const additinalsSchema = new mongoose.Schema(
    {
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


additinalsSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

additinalsSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

export const Additionals = mongoose.model("ProductAdditionals", additinalsSchema);
