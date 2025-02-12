import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
        { $set: { refreshToken: undefined } },
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


export { registerUser, loginUser, LoggedOutUser };
