import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import randomString from "randomstring";
import User from "../models/User.js";
import UserPassword from "../models/UserPassword.js";
import formData from "form-data";
import Mailgun from "mailgun.js";
import dotenv from "dotenv";

dotenv.config();

const generateOtp = (len) => {
  const otp = randomString.generate({
    length: len,
    charset: "numeric",
  });
  return otp;
};

const sendOtpEmail = async (otp, recipientEmail) => {
  const messageData = {
    from: "yousufulabrarkhan@gmail.com",
    to: recipientEmail,
    subject: "Hello! Your OTP",
    text: `Your OTP for verification is ${otp}`,
  };

  const mailgun = new Mailgun(formData);
  const client = mailgun.client({
    username: "MOHD YOUSUF KHAN",
    key: process.env.MAILGUN_API_KEY,
  });

  try {
    const res = await client.messages.create(process.env.DOMAIN, messageData);
    console.log(res);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const generateHashedOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

export const sendingOtp = async (req, res) => {
  const email = req.body.email;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found.");
    }

    const prevOtps = await UserPassword.find({ email: email }).select("otp");

    if (prevOtps.length !== 0) {
      await UserPassword.deleteOne({ email: email });
    }

    const otp = generateOtp(6);
    const recipientEmail = email;
    const otpHash = await generateHashedOtp(otp);
    let currentTime = new Date().getTime();
    let otpExpiryTime = new Date(currentTime + 10 * 60 * 1000);

    console.log(otp);
    console.log(recipientEmail);
    console.log(otpExpiryTime);

    await UserPassword.create(
      [
        {
          email: recipientEmail,
          otp: otpHash,
          otpExpiresAt: otpExpiryTime,
          user: user._id,
        },
      ],
      { session }
    );

    const emailSent = await sendOtpEmail(otp, recipientEmail);
    console.log(emailSent);
    if (!emailSent) {
      throw new Error("Internal server error");
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({success:true});
  } catch (err) {
    console.error(err);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({success:false});
  }
};

// ****************************Verifying OTP*************************************

const verifyOtp = async (storedOtpHash, expirationTime, enteredOtp) => {
  let currentTime = new Date().getTime();

  if (currentTime > expirationTime) {
    throw new Error("OTP has expired.");
  } else {
    const isOtpCorrect = await bcrypt.compare(enteredOtp, storedOtpHash);

    if (!isOtpCorrect) {
      throw new Error("Incorrect OTP. Please enter the correct OTP.");
    } else {
      return true;
    }
  }
};

export const matchOtpUpdate = async (req, res) => {
  const email = req.body.email;
  const enteredOtp = req.body.otp;
  const newPassword = req.body.password;
  const reEnterNewPassword = req.body.rePassword;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const otp = await UserPassword.findOne({ email: email });

    if (!otp) {
      throw new Error("OTP not available for this email. Request for new OTP.");
    }

    await verifyOtp(otp.otp, otp.otpExpiresAt, enteredOtp);

    if (!newPassword || newPassword.trim().length === 0) {
      throw new Error("New password is missing or empty.");
    }

    if (newPassword !== reEnterNewPassword) {
      throw new Error("Both the entered passwords didn't match.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { email },
      { $set: { password: hashedPassword } },
      { session }
    );

    await UserPassword.deleteOne({ email: email }, { session });

    await session.commitTransaction();
    session.endSession();
    // User registered succesfully
    return res.status(200).json({success:true});
  } catch (err) {
    console.error(err);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({success:false});
  }
};
