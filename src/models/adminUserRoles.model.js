import mongoose, {Schema} from "mongoose";

const adminUserRolesSchema = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: "AdminUser"},
    role_id: {type: Schema.Types.ObjectId, ref: "Roles"},
    assignedAt: {type: Date, required: true},
  },
  {timestamps: true},
);

export const AdminUserRoles = mongoose.model("AdminUserRoles", adminUserRolesSchema);
