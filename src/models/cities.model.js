import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const citySchema = new mongoose.Schema(
    {
<<<<<<< HEAD
        name: { type: String, required: true, trim: true, },
        state: { type: mongoose.Schema.Types.ObjectId, ref: "States",  required: true },
        image: { type: String, },
        description: { type: String, required: false, },
        status: { type: String, enum: ["active", "inactive"], default: "active" },

=======
        name: { type: String, required: true,  trim: true,},
        state: { type: String, required: true,   },
        state: { type: Schema.Types.ObjectId,   ref: "States",  required: true, },
        image: { type: String,  },
        description: { type: String,  required: false, },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
>>>>>>> development
    },
    {timestamps: true},
);

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

citySchema.pre("save", function (next) {
<<<<<<< HEAD
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
=======
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

>>>>>>> development

export const Cities = mongoose.model("Cities", citySchema);
