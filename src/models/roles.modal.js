import mongoose , {Schema}  from "mongoose";
import MongooseDelete from "mongoose-delete";

const rolesSchema = new Schema(
  {
    role_name: {type: String, required: true, unique: true},
    description: {type: String},
  },
  {timestamps: true},
);


rolesSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

rolesSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });
export const Roles = mongoose.model("Roles", rolesSchema);
