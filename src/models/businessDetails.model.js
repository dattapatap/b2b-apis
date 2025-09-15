import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";

const businessDetailsSchema = new mongoose.Schema(
  {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        gstin: {
      type: String,
      required: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, // GST format
      trim: true,
      unique: true,
    },
    pan: {
      type: String,
      required: true,
      match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, // PAN format
      trim: true,
      unique: true,
    },
    udyam_number: {
      type: String,
      trim: true,
      match: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/, // e.g. UDYAM-XX-00-0000000
    },
    aadhaar_number: {
      type: String,
      trim: true,
      match: /^\d{12}$/, // 12 digits
    },
    cin_llpin: {
      type: String,
      trim: true,
      match: /^[A-Z0-9]{21}$/, // CIN/LLPIN typical length
    },
    iec: {
      type: String,
      trim: true,
      match: /^[A-Z0-9]{10}$/, // IEC is 10 characters
    },
    tan: {
      type: String,
      trim: true,
      match: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, // TAN format
    },
  },
  { timestamps: true }
);

businessDetailsSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });
export const BusinessDetails = mongoose.model( "BusinessDetails", businessDetailsSchema);
