import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

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
    },
    {timestamps: true},
);

// Capitalize the first letter of each word
function capitalizeWords(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

industrySchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeWords(this.name);
    }
    next();
});

industrySchema.virtual("categories", {
    ref: "Categories",
    localField: "_id",
    foreignField: "industry",
    justOne: false,
});

industrySchema.plugin(MongooseDelete, {deleted: true, overrideMethods: "all"});
industrySchema.set("toJSON", {
    transform: function (doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});

export const Industries = mongoose.model("Industries", industrySchema);
