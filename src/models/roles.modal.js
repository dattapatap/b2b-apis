import mongoose , {Schema}  from "mongoose";

const rolesSchema = new Schema(
  {
    role: {type: String, required: true, unique: true},
    description: {type: String},
  },
  {timestamps: true},
);

export const Roles = mongoose.model("Roles", rolesSchema);
