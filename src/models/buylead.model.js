import mongoose from "mongoose";

const buyLeadSchema = new mongoose.Schema(
  {
        buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true, // like "pieces", "kg", etc.
    },
    description: {
      type: String,
    },
   
    phone: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    category: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "closed"],
      default: "pending",
    },

  },
  { timestamps: true }
);

export const BuyLead = mongoose.model("BuyLead", buyLeadSchema);
