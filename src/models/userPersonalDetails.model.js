import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const personalDetailsSchema = new Schema(
    {
        user_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
        company_name: {type: String},
        contact_person: {type: String},
        designation: {type: String},

        primary_mobile: {type: String},
        alt_mobile: {type: String},
        primary_email: {type: String},
        landline_no: {type: String},

        pincode: {type: String},
        city: {type: String},
        district: {type: String},
        state: {type: String},
        country: {type: String},
        floor: {type: String},
        area_street: {type: String},
        locality: {type: String},
        landmark: {type: String},

        catalog_url: {type: String},
        website_url: {type: String},
        google_business_url: {type: String},
        facebook_url: {type: String},
        map_url: {type: String},

        company_logo: {type: String},
        digitalB2B_member_since: {type: Date},
        number_of_employees: {type: Number},
        annual_turnover: {type: String},
        gst_registration_date: {type: Date},
        gst_number: {type: String},
        exports_to: {type: String},
        address: {type: String},
    },
    {timestamps: true},
);

personalDetailsSchema.plugin(MongooseDelete, {deleted: true, overrideMethods: "all"});
export const UserPersonalDetails = mongoose.model("UserPersonalDetails", personalDetailsSchema);
