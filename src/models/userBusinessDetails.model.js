import mongoose, {Schema} from "mongoose";

const userBusinessDetailSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: "User", required: true},

        ownership_type: {type: String},
        primary_business_type: {type: String},
        secondary_business_type: {type: String},
        annual_turnover: {type: String},
        ceo_name: {type: String},
        no_of_employee: {type: Number},
        profile_pic: {type: String},

        gst_in_no: {type: String},
        registration_date: {type: Date},
        pan_no: {type: String},
        udyam_no: {type: String},
        aadhaar_no: {type: String},
        cin_no: {type: String},
        tan_no: {type: String},
    },
    {
        timestamps: true,
    },
);

export const UserBusinessDetails = mongoose.model("UserBusinessDetails", userBusinessDetailSchema);
