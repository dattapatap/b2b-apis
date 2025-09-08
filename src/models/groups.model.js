import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const groupSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: "", 
        },
        keywords: {
            type: [String], 
            default: [],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    },
);

groupSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

groupSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });



export const Groups = mongoose.model("Groups", groupSchema);

