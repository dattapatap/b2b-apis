import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        name: {type: String, required: false},
        designation: {type: String, required: false},
        mobile: {type: String, required: true, unique: true, minlength: 10, maxlength: 10},
        alt_email: {type: String, required: false},

        email: {type: String, required: false},
        alt_mobile: {type: String, required: false, min: 10, max: 10},

        otp: {type: String},
        otpExpires: {type: Date},
        isVerified: {type: Boolean, default: false},

        profile: {type: String, required: false},
        status: {type: String, enum: ["ACTIVE", "BLOCKED"], default: "ACTIVE"},
        refreshToken: {type: String},

        // bank_details: [{type: Schema.Types.ObjectId, ref: "UserAddress"}],
        // addresses: [{type: Schema.Types.ObjectId, ref: "UserAddress"}],
        // roles: [{type: Schema.Types.ObjectId, ref: "UserRoles"}],
    },
    {
        timestamps: true,
    },
);

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            mobile: this.mobile,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
    );
};

export const User = mongoose.model("User", userSchema);
