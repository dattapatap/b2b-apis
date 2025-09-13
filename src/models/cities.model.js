import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const citySchema = new mongoose.Schema(
    {
        name: { type: String, required: true,  trim: true,},
        state: { type: String, required: true,   },
        state: { type: Schema.Types.ObjectId,   ref: "States",  required: true, },
        image: { type: String,  },
        description: { type: String,  required: false, },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    {timestamps: true},
);


function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

citySchema.pre("save", function (next) {
    if (this.name) {
        this.name = capitalizeWords(this.name);
    }
    next();
});

citySchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.name = capitalizeWords(update.name);
        this.setUpdate(update);
    }
    next();
});


citySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: "all" });
citySchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});


export const Cities = mongoose.model("Cities", citySchema);
