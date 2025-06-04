import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        name: {type: String, required: false},
        designation: {type: String, required: false},
        mobile: {type: String, required: true, unique: true, minlength: 10, maxlength: 10},
        alt_email: {type: String, required: false},

        email: {type: String, required: false},
        password: String,
        alt_mobile: {type: String, required: false, min: 10, max: 10},

        isVerified: {type: Boolean, default: false},

        profile: {type: String, required: false},
        status: {type: String, enum: ["ACTIVE", "BLOCKED"], default: "ACTIVE"},
        // refreshToken: {type: String},
        refreshToken: { type: Map, of: String, default: {} },

        bank_details: [{type: Schema.Types.ObjectId, ref: "UserAddress"}],
        addresses: [{type: Schema.Types.ObjectId, ref: "UserAddress"}],
        roles: [{type: mongoose.Schema.Types.ObjectId, ref: "UserRoles"}],

        otp: {type: String, required: false},
        otpExpires: {type: Date, required: false},
        
    },    
    {
        timestamps: true,
    },
);



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
            _id: this._id,
            roles: this.roles.map(role => role.role_name),
            mobile: this.mobile,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: days||process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};

userSchema.methods.generateRefreshToken = function (days) {    
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: days || process.env.REFRESH_TOKEN_EXPIRY,
        },
    );
};


userSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'roles', 
        select: '_id',
        populate: {
            path: 'role_id', 
            model: 'Roles',
            select: 'role_name', 
        },
    });


    next();
});


export const User = mongoose.model("User", userSchema);
