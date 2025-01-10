import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiError} from "../../utils/ApiError.js";
import {User} from "../../models/user.model.js";
import {uploadOnCloudinary} from "../../utils/cloudinary.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import dayjs from "../../utils/daydateconfig.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Roles } from "../../models/roles.modal.js";
import { UserRoles } from "../../models/userRoles.modal.js";

// Generate Acess And Refresh Token
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

// generate custom OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
const sendOtp = asyncHandler(async (req, res) => {
    const mobileNo  = req.body.mobile;
    const role      = req.body.role;    

    if (!mobileNo || mobileNo.trim() === "") {
        throw new ApiError(401, "Mobile field is required");
    }

    let roleId = await Roles.findOne({role_name:role });
    if (!roleId) {
        throw new ApiError(401, "Role is missing");
    }
    
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        let currUser = await User.findOne({mobile: mobileNo}).session(session);
        if (!currUser) {
            currUser = await User.create([{mobile: mobileNo}], { session });
            currUser = currUser[0];
        }

        const existingUserRole = await UserRoles.findOne({role_id: roleId._id, user_id: currUser._id }).session(session);
        if (!existingUserRole) {
            const userRole = await UserRoles.create([{ role_id: roleId._id, assignedAt:dayjs().tz().toDate(), user_id: currUser._id }], { session });
            currUser.roles.push(userRole[0]._id);
        }
       
        const otp = generateOTP();
        const otpExpires = dayjs().tz().add(10, "minute").toDate();

        currUser.otp = otp;
        currUser.otpExpires = otpExpires;
        await currUser.save({session});

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(new ApiResponse(200, {OTP: otp}, "OTP Sent Successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error handling OTP:", error);
        throw new ApiError(500, "Error handling OTP.");
    }
});

// Verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
    const {mobile, otp, role} = req.body;

    if (!mobile && !otp) {
        throw new ApiError(400, "Mobile number and OTP are required");
    } 

    let currUser = await User.findOne({mobile: mobile});

    if (!currUser) {
        throw new ApiError(404, "User not found");
    }

    if (dayjs().isAfter(dayjs(currUser.otpExpires))) {
        return res.status(400).json({error: "OTP expired"});
    }

    if (currUser.otp !== otp) {
        return res.status(400).json({error: "Invalid OTP"});
    }

    
    const roleDoc = await Roles.findOne({ role_name: role });
    if (!roleDoc) {
        throw new ApiError(400, "Invalid role");
    }

    // check if user already has the role
    const existingUserRole = await UserRoles.findOne({ role_id: roleDoc._id, user_id: currUser._id,});
    if (!existingUserRole) {
        const userRole = await UserRoles.create({ role_id: roleDoc._id, assignedAt: dayjs().tz().toDate(), user_id: currUser._id, });
        currUser.roles.push(userRole._id); 
        await currUser.save();
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(currUser._id);

    const loggedInUser = await User.findOne({_id:currUser._id}).select("-otp -otpExpires -refreshToken");

    const options = { httpOnly: true,  secure: true,};

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {user: loggedInUser, accessToken, refreshToken},
                "User logged In Successfully",
            ),
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

    return res
        .status(200)
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

const updateUserCoverImage = asyncHandler(async (req, res) => {
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


export {
    sendOtp,
    verifyOtp,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
};
