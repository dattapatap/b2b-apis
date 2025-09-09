import mongoose, {Schema} from "mongoose";
import MongooseDelete from "mongoose-delete";

const userBankDetailsSchema = new Schema(
    {
        user_id: {type: Schema.Types.ObjectId, ref: "User", required: true},
        account_no: {type: String, required: true},
        account_holder: {type: String, required: false},
        ifsc_code: {type: String, required: true},
        branch_name: {type: String, required: true},
        bank_name: {type: String, required: true},
    },
    {
        timestamps: true,
    },
);

<<<<<<< HEAD
userBankDetailsSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

userBankDetailsSchema.plugin(MongooseDelete, { deleted: true, overrideMethods: 'all' });



=======

userBankDetailsSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});

>>>>>>> development
export const UserBankDetails = mongoose.model("UserBankDetails", userBankDetailsSchema);
