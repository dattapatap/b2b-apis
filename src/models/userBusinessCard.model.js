import mongoose, { Schema } from "mongoose";
import MongooseDelete from "mongoose-delete";

const userBusinessCardSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        front_view: {type: String, required: false},
        back_view: {type: String, required: false},
    },
    {
        timestamps: true,
    },
);

<<<<<<< HEAD
userBusinessCardSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

userBusinessCardSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });


=======
userBusinessCardSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});

>>>>>>> development
export const UserBussinessCard = mongoose.model("UserBussinessCard", userBusinessCardSchema);
