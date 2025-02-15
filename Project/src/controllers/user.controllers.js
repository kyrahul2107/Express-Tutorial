import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        // Step 1: Find the user in the database using the provided userId
        const user = await User.findById(userId);

        // Step 2: If the user does not exist, throw an error
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Step 3: Generate a refresh token using the user schema method
        const refreshToken = user.generateRefreshToken();

        // Step 4: Generate an access token using the user schema method
        const accessToken = user.generateAccessToken();

        // Step 5: Attempt to save the user in the database with the generated tokens

        user.refreshToken = refreshToken;
        try {
            await user.save({ validateBeforeSave: false });
        } catch (error) {
            // Log any errors that occur while saving the user
            console.error("Error saving user:", error);

            // Throw a specific error indicating that saving failed
            throw new ApiError(500, "Failed to save user");
        }

        // Step 6: Return the generated access and refresh tokens
        return { accessToken, refreshToken };
    } catch (error) {
        // If any error occurs in the process, throw a generic error
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};


// Register a user Method
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // Validation - not empty
    // Check if user already exists: username, email
    // Check for images and avatar
    // upload them to Cloudinary, check avatar existence or not
    // create user object -- create entry in db
    // Remove password and refresh token fields from response
    // check for user creation 
    // return response
    // get user details from frontend

    const { username, fullName, email, password } = req.body;
    console.log("Email", email);
    console.log("User Name is: ", username);
    console.log("Full Name is:", fullName);
    console.log("Passwor id ", password);
    // console.log("Received files:", req.files);

    // Check if fields are empty
    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if the user already exists:username,email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Handle file uploads and check for avatar
    const avatarLocalPath = req.files?.avatar ? req.files.avatar[0]?.path : null;
    const coverImageLocalPath = req.files?.coverImage ? req.files.coverImage[0]?.path : null;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image Local Path is not Found");
    }

    // Upload images to Cloudinary (assuming this function returns the image URL after upload)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar image is not uploaded to Cloudinary");
    }

    // Create the new user Object to store the Data in the DataBase
    const user = new User({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
    });

    await user.save();

    const createdUser = await User.findById(user._id).select(
        "-password -refershToken"
    )

    // check for user creation 
    if (!createdUser) {
        throw new ApiError(500, "Somthing Went Wrong While registering the user")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register Successfully")
    )
});

// Login a User Method
const loginUser = asyncHandler(async (req, res) => {

    // Step 1: Extract data from the request body
    const { email, username, password } = req.body;

    // Step 2: Validate if either email or username is provided
    if (!username || !email) {
        throw new ApiError(400, "Username or email is required");
    }

    // Step 3: Find the user in the database using email or username
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // If user does not exist, throw an error
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Step 4: Check if the provided password is correct
    const isPasswordValid = await user.isPasswordCorrect(password);

    // If password is incorrect, throw an error
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect");
    }

    // Step 5: Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);

    // Step 6: Fetch the user data excluding password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Step 7: Define cookie options for security
    const options = {
        httpOnly: true,  // Prevents client-side JavaScript from accessing the cookie
        secure: true     // Ensures the cookie is sent only over HTTPS
    };

    // Step 8: Send response with cookies and user details
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)   // Sets access token in an HTTP-only cookie
        .cookie("refreshToken", refreshToken, options) // Sets refresh token in an HTTP-only cookie
        .json({
            status: 200,
            message: "User logged in successfully",
            user: loggedInUser,
            accessToken,
            refreshToken
        });
});

// Loggedout Method
const LoggedOutUser = asyncHandler(async (req, res) => {

    // Remove the refresh token from the database
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: 1 } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options) // Clear access token
        .clearCookie("refreshToken", options) // Clear refresh token
        .json({
            status: 200,
            message: "User logged out successfully"
        });

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json({ success: false, message: "Unauthorized Request" });
    }

    try {
        // Verify the refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Find the user
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        // Check if refresh token matches the one stored in the database (if hashed)
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token and Incoming Refresh Token do not match");
        }

        // Generate a new access token
        const newAccessToken = user.generateAccessToken();

        // Set the new access token in cookies (Choose this OR JSON response)
        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        });

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully"
        });

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(403, "Refresh Token has expired. Please log in again.");
        } else {
            throw new ApiError(403, "Invalid Refresh Token");
        }
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if the old password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // Update the password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    // Return success response
    return res
        .status(200)
        .json(
            new ApiResponse(200, "Password changed successfully", null)
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User Fetched SuccessFully")
        )
})

const UpdateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    console.log('Inside Update Account Details');
    
    if (!fullName || !email) {
        throw new ApiError(400, "All Fields are Required");
    }

    const user =await  User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password"); // Exclude password from response

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar Image Uploaded Successfully")
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) {
        throw new ApiError(400, "Avtar file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error While uploading");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover Image Uploaded SuccessFully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // Finding user using params
    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "Username is Missing");
    }

    // Finding the channel using aggregation
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribedTo",
            },
        },
        {
            $addFields: {
                subscriberCount: { $size: "$Subscribers" },
                channelSubscribedToCount: { $size: "$SubscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$Subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
            },
        },
    ]);

    if (!channel.length) {
        throw new ApiError(404, "Channel Does Not Exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User Channel Fetched Successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    console.log('Inside Get Watch History Method');
    
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),

            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "Owner",
                        },
                    },
                    {
                        $unwind: {
                            path: "$Owner",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            "Owner.fullName": 1,
                            "Owner.username": 1,
                            "Owner.avatar": 1,
                        },
                    },
                ],
            },
        },
    ]);

    return res.status(200).json(new ApiResponse(200, user, "Watch History Fetched Successfully"));
});


export {
    registerUser,
    loginUser,
    LoggedOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    UpdateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory,
};
