import { Router } from "express"
import
 { 
    LoggedOutUser,
    loginUser, 
    registerUser ,
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    UpdateAccountDetails, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    updateUserAvatar,
    getWatchHistory
} from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

// To Register the user 
router.route("/register").post(
    // Injecting this Middleware Before the register method to upload the File
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

// For login the user
router.route("/login").post(loginUser);

// Secured Routes
// Injecting the verifyJWT Middleware Token before LoggedOutUser method to get the Token of Login User
router.route("/logout").post(verifyJWT,LoggedOutUser);
// To Refersh the access Token when It expires
router.route("/refresh-token").post(refreshAccessToken);



router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/update-account").patch(verifyJWT,UpdateAccountDetails);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);


router.route("/cover-image")
.patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT,getWatchHistory);




export default router;