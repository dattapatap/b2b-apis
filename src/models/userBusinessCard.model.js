import mongoose, { Schema } from "mongoose";

const userBusinessCardSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        front_view: {type: String, required: false},
        back_view: {type: String, required: false},
    },
    {
        timestamps: true,
    },
);

export const UserBussinessCard = mongoose.model("UserBussinessCard", userBusinessCardSchema);
