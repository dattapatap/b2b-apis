import mongoose, {Schema} from "mongoose";

const userBankDetailsSchema = new Schema(
    {
        user_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
        account_no: {type: String, required: true},
        account_holder: {type: String, required: true},
        ifsc_code: {type: String, required: true},
        branch_name: {type: String, required: true},
        bank_name: {type: String, required: true},
    },
    {
        timestamps: true,
    },
);

export const UserBankDetails = mongoose.model("UserBankDetails", userBankDetailsSchema);
