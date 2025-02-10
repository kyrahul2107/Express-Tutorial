import { Router } from "express"
import { registerUser } from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()

// To Register the user 
router.route("/register").post(
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
// router.route("/login").post(loginUser);

// For logout the user
// router.route("/login").post(loginOut);






export default router;