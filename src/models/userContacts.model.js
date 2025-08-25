import mongoose, {Schema} from "mongoose";

const userContactsSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        division: {type: String, required: true, default: "Head Office"},
        contact_person: String,
        address: {
          address_line: { type: String },
          landmark: { type: String }, 
          city: { type: String },
          state: { type: String },
          postal_code: { type: String },
          country: { type: String },
        },
        mobile_no: { type: String },
        landline_no: { type: String },
        toll_free_no: { type: String },
        email: { type: String },
        fax_no: { type: String },
        sr_no: { type: Number, required: true, },

    },
    {
      timestamps: true,
    },
);

export const UserContacts = mongoose.model("UserContacts", userContactsSchema);
