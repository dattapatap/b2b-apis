import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const stateSchema = new Schema(
    {
<<<<<<< HEAD
        state_name: {
            type: String,
            required: true,
            unique: true,
        },

        state_code: {
            type: String,
            required: false
        },
        country: {
            type: mongoose.Schema.Types.ObjectId, ref: "Countries",  required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
=======
        state_name: { type: String, required: true,   unique: true, },
        state_code: { type: String, required: true },
        country_id: { type: Schema.Types.ObjectId,   ref: "Countries",  required: true, },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
>>>>>>> development
    },
    {timestamps: true},
);

<<<<<<< HEAD

stateSchema.pre("save", function (next) {
  if (this.state_code) {
    this.state_code = this.state_code.toUpperCase();
  }
=======
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

stateSchema.pre("save", function (next) {
>>>>>>> development
  if (this.state_name) {
    this.state_name = this.state_name.toUpperCase();
  }
  next();
});

<<<<<<< HEAD
stateSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();

  if (update.state_code) {
        update.state_code = update.state_code.toUpperCase();
        this.setUpdate(update);
  }
  if (update.state_name) {
        update.state_name = update.state_name.toUpperCase();
        this.setUpdate(update);
  }

  if (update.$set && update.$set.state_code) {
    update.$set.state_code = update.$set.state_code.toUpperCase();
    this.setUpdate(update);
  }
=======
stateSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  let update = this.getUpdate();

  if (update.state_name) {
    update.state_name = update.state_name.toUpperCase();
    this.setUpdate(update);
  }

>>>>>>> development
  if (update.$set && update.$set.state_name) {
    update.$set.state_name = update.$set.state_name.toUpperCase();
    this.setUpdate(update);
  }

  next();
});

<<<<<<< HEAD

stateSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

=======
stateSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});


>>>>>>> development
stateSchema.plugin(MongooseDelete, {deleted: true, overrideMethods: "all"});

export const States = mongoose.model("States", stateSchema);
