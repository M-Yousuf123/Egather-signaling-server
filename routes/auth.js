import express from "express";
import { register, login } from "../controllers/authController.js";
import {
  sendingOtp,
  matchOtpUpdate,
} from "../controllers/setPasswordController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/set-password-otp-send", sendingOtp);
router.put("/otp-verify", matchOtpUpdate);

export default router;
