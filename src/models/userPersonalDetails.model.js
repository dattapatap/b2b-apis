import mongoose, {Schema} from "mongoose";

const personalDetailsSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: "User", required: true},
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
    },
    {timestamps: true},
);

export const UserPersonalDetails = mongoose.model("UserPersonalDetails", personalDetailsSchema);
