// import mongoose from "mongoose";

// const buyLeadSchema = new mongoose.Schema(
//   {
//     productName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     quantity: {
//       type: Number,
//       required: true,
//     },
//     unit: {
//       type: String,
//       required: true, // like "pieces", "kg", etc.
//     },
//     description: {
//       type: String,
//     },
//     buyerName: {
//         type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//     },
//     phone: {
//       type: String,
//       required: true,
//     },
//     location: {
//       type: String,
//     },
//     category: {
//       type: String,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "approved", "closed"],
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// export const BuyLead = mongoose.model("BuyLead", buyLeadSchema);
