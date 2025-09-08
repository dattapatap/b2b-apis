import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const citySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, },
        state: { type: mongoose.Schema.Types.ObjectId, ref: "States",  required: true },
        image: { type: String, },
        description: { type: String, required: false, },
        status: { type: String, enum: ["active", "inactive"], default: "active" },

    },
    {timestamps: true},
);

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


citySchema.pre("save", function (next) {
  if (this.name) {
    this.name = capitalizeFirstLetter(this.name);
  }
  next();
});

citySchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();

  if (update.name) {
    update.name = capitalizeFirstLetter(update.name);
    this.setUpdate(update);
  }

  if (update.$set && update.$set.name) {
    update.$set.name = capitalizeFirstLetter(update.$set.name);
    this.setUpdate(update);
  }

  next();
});

citySchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

citySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

export const Cities = mongoose.model("Cities", citySchema);
