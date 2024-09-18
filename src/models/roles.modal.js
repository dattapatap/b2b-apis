import mongoose , {Schema}  from "mongoose";

const roleSchema = new Schema(
  {
    role_name: {type: String, required: true, unique: true},
    description: {type: String},
  },
  {timestamps: true},
);

export const Roles = mongoose.model("Roles", roleSchema);
