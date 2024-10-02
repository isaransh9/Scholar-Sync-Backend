import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  verifyEmail,
  getUserOfSameCollege,
  userExist,
  forgotPassword,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(registerUser);
router.route("/verify").get(verifyEmail);
router.route("/login").post(loginUser);
router.route("/userExist").post(userExist);
router.route("/forgotPassword").post(forgotPassword);

//Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/getUserOfSameCollege").post(verifyJWT, getUserOfSameCollege);

export default router;
