import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {User} from "../../models/user.model.js";
import {uploadOnCloudinary} from "../../utils/cloudinary.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { sendEmail } from '../../utils/mailer.js';
import * as crypto from 'crypto';
import bcrypt from "bcrypt"


// Generate Access And Refresh Token
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
    } catch (error) {
        console.log(error);        
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
};


const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password ) {
        throw new ApiError(401, "All feild are mandatory");
    }
    
    const user = await User.findOne({ email }).populate('roles');
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
       
    const isPasswordValid = await user.isPasswordCorrect(password)
    console.log(isPasswordValid);
    

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const isAdmin = user.roles.some(role => role.role_id.role_name === 'admin');
    if (!isAdmin) {
        return res.status(403).json({ message: 'Access Denied' });
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);
    const loggedInUser = await User.findOne({_id:user._id}).select("-password -refreshToken");
    const options = { httpOnly: true,  secure: true,};

    return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json( new ApiResponse( 200, {user: loggedInUser, accessToken, refreshToken}, "User logged In Successfully", ),
        );

});


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed",
                ),
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});


const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email,
            },
        },
        {new: true},
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        {new: true},
    ).select("-password");


    return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"));
});


const forgetPassword = asyncHandler ( async( req, res ) =>{
    let user = null;
    try {
        const { email} = req.body;
        if (!email ) {
            throw new ApiError(401, "Email is required field");
        }
            
        user = await User.findOne({ email }).populate('roles');
        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist' });
        }

        const isAdmin = user.roles.some(role => role.role_id.role_name === 'admin');
        if (!isAdmin) {
            return res.status(403).json({ message: 'Access Denied' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.otp = crypto.createHash('sha256').update(otp).digest('hex');
        user.otpExpires = Date.now() + 10 * 60 * 1000; 
        await user.save({ validateBeforeSave: false });

        const message = `Your OTP is: ${otp}. It is valid for the next 10 minutes.`;
        
        await sendEmail({ email: user.email,subject: 'Your OTP Code', message,  });

        res.status(200).json(new ApiResponse(200 , "Forget password OTP sent to your mail!"));

    }catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(error);
        
        return res.status(500).json({status: false, message: 'Error sending email. Try again later.',});
    }
})

const setPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!otp || !newPassword) {
        throw new ApiError(400, 'All field are mandatory');
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.otp || Date.now() > user.otpExpires) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    } 
    
    const hashedPass = await bcrypt.hash(newPassword, 10);
    await User.updateOne( { email }, { password: hashedPass, otp: undefined, otpExpires: undefined });
    
    res.status(200).json(new ApiResponse(200 , "Password updated successfully"));

})


export {
    login,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    forgetPassword,
    setPassword,
};
