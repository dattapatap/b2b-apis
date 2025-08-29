import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const adminUserSchema = new Schema(
    {
        roles: [{type: Schema.Types.ObjectId, ref: "AdminUserRoles", default: [],}],    
        name: {type: String, required: false},
        email: {type: String, required: false},
        mobile: {type: String, required: true, unique: true, minlength: 10, maxlength: 10},
                
        profile: {type: String, required: false},
        status: {type: String, enum: ["ACTIVE", "BLOCKED"], default: "ACTIVE"},
            
        password:{ type: String, required : false },
        
        refreshToken: { type: String, required: true },
        otp: {type: String, required: false},
        otpExpires: {type: Date, required: false},


    },  
    {
        timestamps: true,
    },
);



adminUserSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

adminUserSchema.methods.isPasswordCorrect = async function(password){ 
    return await bcrypt.compare(password, this.password)
}


adminUserSchema.methods.generateAccessToken = function (days) {
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

adminUserSchema.methods.generateRefreshToken = function (days) {    
    return jwt.sign(
        {
            id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: days || process.env.REFRESH_TOKEN_EXPIRY,
        },
    );
};


adminUserSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'roles', 
        select: '_id role_id',
        populate: {
            path: 'role_id', 
            model: 'Roles',
            select: 'role_name', 
        },
    });
    next();
});

adminUserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    if (Array.isArray(ret.roles)) {
      ret.roles = ret.roles
        .map((role) => role?.role_id?.role_name)
        .filter(Boolean);
    }
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});



export const AdminUser = mongoose.model("AdminUser", adminUserSchema);
