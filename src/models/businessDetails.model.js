import mongoose, {Schema} from "mongoose";

const BusinessDetailsSchema = new Schema(
    {
        company_name: {type: String, required: false},
        company_logo_url: {type: String, required: false},
        company_type: {
            type: String,
            enum: ["Proprietorship", "Pvt Ltd", "Partnership", "LLP", "Other"],
        },
        business_category: {type: String, required: false},
        established_year: {type: Number, required: false},
        gst_number: {type: String, required: false},
        pan_number: {type: String, required: false},
        udyam_registration_number: {type: String, required: false},
        cin_number: {type: String, required: false},
        fssai_number: {type: String, required: false},
        business_license_url: {type: String, required: false},
        description: {type: String, required: false},
        business_tagline: {type: String, required: false},
        working_hours: {
            start_time: {type: String, required: false},
            end_time: {type: String, required: false},
            working_days: [
                {
                    type: String,
                    required: false,
                    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                },
            ],
        },
    },
    {timestamps: true},
    {_id: false},
);

categorySchema.pre("save", function (next) {
    if (this.company_name) {
        this.company_name = this.company_name.toLowerCase();
    }
    next();
});

categorySchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    if (update.company_name) {
        update.company_name = update.company_name.toLowerCase();
        this.setUpdate(update);
    }
    next();
});


export const BusinessDetails = mongoose.model("BusinessDetails", BusinessDetailsSchema);
