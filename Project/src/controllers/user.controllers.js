import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
