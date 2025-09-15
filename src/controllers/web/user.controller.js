import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";

import Joi from "joi";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import {User} from "../../models/user.model.js";
import {uploadOnCloudinary} from "../../utils/cloudinary.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import dayjs from "../../utils/daydateconfig.js";
import { Roles } from "../../models/roles.modal.js";


// Generate Acess And Refresh Token
const generateAccessAndRefereshTokens = async (userId, device) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken('100d');
        const refreshToken = user.generateRefreshToken('125d');

        if (!user.refreshToken || !(user.refreshToken instanceof Map)) {
            user.refreshToken = new Map();
        }
        user.refreshToken.set(device, refreshToken);
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };

    } catch (error) {
        console.log(error);        
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
};


// generate custom OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


// Send OTP
export const sendOtp = asyncHandler(async (req, res) => {
    const { mobile, role } = req.body;
    const session = await mongoose.startSession();

    session.startTransaction();
    
    const loginSchema = Joi.object({
        mobile: Joi.string().required().min(10).max(10),
    });
    await loginSchema.validateAsync({ mobile }, { abortEarly: false });

    let currUser = await User.findOne({ mobile }).session(session);
    if (!currUser) {
        currUser = await User.create([{ mobile }], { session });
        currUser = currUser[0];
    }

    const otp = generateOTP();
    const otpExpires = dayjs().tz().add(10, "minute").toDate();

    currUser.otp = otp;
    currUser.otpExpires = otpExpires;
    await currUser.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json(new ApiResponse(200, { OTP: otp }, "OTP Sent Successfully")); 
});



// Verify OTP
export const verifyOtp = asyncHandler(async (req, res) => {
    const {mobile, otp } = req.body;

    const loginSchema = Joi.object({
        mobile: Joi.string().required().min(10).max(10),
        otp: Joi.string().required().min(6).max(6),
    });        
    await loginSchema.validateAsync({  mobile,  otp },{ abortEarly: false });

    let currUser = await User.findOne({mobile: mobile});

    if (!currUser) {
       throw new ApiError(404, "User not found" );
    }

    if (dayjs().isAfter(dayjs(currUser.otpExpires))) {
       throw new ApiError(400,  "OTP expired");
    }

    if (currUser.otp !== otp) {
        throw new ApiError(400,  "Invalid OTP");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(currUser._id, "web");
    const loggedInUser = await User.findOne({_id:currUser._id}).select("-otp -otpExpires -refreshToken");
    console.log(loggedInUser);
    
    const options = { httpOnly: true,  secure: true,};

    return res.cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {user: loggedInUser, accessToken, refreshToken},
                        "User logged In Successfully",
                    ),
                );
            
});



export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const deviceType = "web";
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {                
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, null,  "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken?.get(deviceType)) {
            throw new ApiError(401, "Refresh token is expired or used");
        }


        const options = {
            httpOnly: true,
            secure: true,
        };

        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id, deviceType);
        return res.cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: refreshToken},
                    "Access token refreshed",
                ),
            );

    } catch (error) {     
        throw new ApiError(401, null, error?.message || "Invalid refresh token");
    }
});



export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});


export const updateAccountDetails = asyncHandler(async (req, res) => {
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

export const updateUserAvatar = asyncHandler(async (req, res) => {
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

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        {new: true},
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});


export const logoutUser = asyncHandler(async (req, res) => {

    const deviceType = "web";

    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { [`refreshTokens.${deviceType}`]: "" } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});
