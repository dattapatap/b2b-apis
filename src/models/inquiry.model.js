import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";


const inquirySchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ["buyer", "seller"],
          required: true,
        },
        text: { type: String },
        attachments: [{ type: String }], 
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);



inquirySchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

inquirySchema.set("toJSON", {
  transform: function (doc, ret) {  
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});


export const Inquiry = mongoose.model("Inquiry", inquirySchema);
