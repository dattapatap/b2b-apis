import mongoose, {Schema} from "mongoose";

const citySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        description: {
            type: String,
            required: false,
        },
        isDeleted: {type: Boolean, default: false},
    },
    {timestamps: true},
);


citySchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name.toLowerCase();
    }
    next();
});

citySchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = update.name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});

export const Cities = mongoose.model("Cities", citySchema);
