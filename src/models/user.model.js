import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        seller_id: {type: String, required: false},
        roles: { type: [String], enum: ["buyer", "seller"],  default: ["buyer"] },
        
        name: {type: String, required: false},
        email: {type: String, required: false},
        mobile: {type: String, required: true, unique: true, minlength: 10, maxlength: 10},
        
        seller_type : { type : String, required : false},
        isVerified: {type: Boolean, default: false},
        
        profile: {type: String, required: false},
        status: {type: String, enum: ["ACTIVE", "BLOCKED"], default: "ACTIVE"},
                
        refreshToken: { type: Map, of: String, default: {} },
        otp: {type: String, required: false},
        otpExpires: {type: Date, required: false},
        
    },  
    {
        timestamps: true,
    },
);
 


userSchema.virtual("personal_details", {
    ref: "UserPersonalDetails",
    localField: "_id",
    foreignField: "user",
    justOne: true,
});

userSchema.virtual("contacts", {
    ref: "UserContacts",
    localField: "_id",
    foreignField: "user",
});
  
  // One-to-One relations
userSchema.virtual("bussiness_card", {
    ref: "BusinessCard",
    localField: "_id",
    foreignField: "user",
    justOne: true,
});
  

userSchema.virtual("business_details", {
    ref: "UserBusinessDetails",
    localField: "_id",
    foreignField: "user",
    justOne: true,
});
  

userSchema.virtual("bank_details", {
    ref: "UserBankDetails",
    localField: "_id",
    foreignField: "user",
    justOne: true,
});


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){ 
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function (days) {
    return jwt.sign(
        {
            id: this.id,
            roles: this.roles,
            mobile: this.mobile,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: days||process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};

userSchema.methods.generateRefreshToken = function (days) {    
    return jwt.sign( {
            id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: days || process.env.REFRESH_TOKEN_EXPIRY,
        },
    );
};


userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    ret.id = ret._id;  
    delete ret._id; 
    return ret;
  }
});


export const User = mongoose.model("User", userSchema);
