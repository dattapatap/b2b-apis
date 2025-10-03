import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, 
    price: { type: Number, required: true }, 
    durationType: { type: String, enum: ["monthly", "yearly", "free"], default: "free" },
    durationDays: { type: Number, required: true },
    buyLeads: { type: Number, default: 0 }, 
    perBuyLeadPrice: { type: Number }, 
    features: [
      {
        featureName: { type: String, required: true }, // e.g. Visibility
        available: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Package = mongoose.model("Package",PackageSchema);
