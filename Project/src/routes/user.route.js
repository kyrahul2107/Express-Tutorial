import { Router } from "express"
import { LoggedOutUser, loginUser, registerUser } from "../controllers/user.controllers.js"
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







export default router;