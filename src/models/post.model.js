import { Schema } from "mongoose";
import mongoose from "mongoose";
import MongooseDelete from "mongoose-delete";


const postSchema = new mongoose.Schema({
    Categories_id: { type: Schema.Types.ObjectId, ref: 'Categories', required: true },
    Product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true},
    buyer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
})
postSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });

postSchema.set("toJSON", {
  transform: function (doc, ret) {  
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
export const Post = mongoose.model("Post", postSchema);