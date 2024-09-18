import mongoose, {Schema} from "mongoose";
import { User } from "./user.model.js";
import { Roles } from "./roles.modal.js";

const userRoleSchema = new Schema(
  {
    user_id: {type: Schema.Types.ObjectId, ref: User},
    role_id: {type: Schema.Types.ObjectId, ref: Roles},
    assignedAt: {type: Date, required: true},
  },
  {timestamps: true},
);

export const UserRoles = mongoose.model("UserRoles", userRoleSchema);
