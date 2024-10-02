import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }
  try {
    // Verify Token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // Find user in DB
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, " Refresh token expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(error?.message || "Something went wrong");
  }
});

const sendVerificationEmail = async (fullName, email, userId, purpose) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Verification email",

    // What ever you want to send here
    html:
      "<p>Hii " +
      fullName +
      ', please click here to <a href="https://scholar-sync-backend-3.onrender.com/api/v1/user/verify?id=' +
      userId +
      '"> Verify </a> your mail.</p>',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email for registration:", error);
    throw new ApiError(
      400,
      "Something went wrong while sending verification email for registration"
    );
  }
};

const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const verifiedUser = await User.updateOne(
      { _id: req.query.id },
      { $set: { isVerified: true } }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, verifiedUser, "User Verified Successfully"));
  } catch (error) {
    throw new ApiError(400, "Failed to send verification email");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  console.log("Register API Called");
  const { fullName, email, collegeName, phoneNumber, domain, password, role } =
    req.body;
  if (
    [fullName, email, collegeName, phoneNumber, role, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    fullName,
    email,
    collegeName,
    phoneNumber,
    domain,
    password,
    role,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  sendVerificationEmail(fullName, email, createdUser._id, "registration");

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  console.log("Login API Called");
  // Algorithm
  // Extract the data received from the frontend --> req.body
  // Validate the data
  // find the Business in the database
  // check if the entered password is matching against the one stored in the database
  // Generate access and refresh token
  // send secure cookies
  // Successfully logged in

  const { password, email } = req.body;

  // if email is not available
  if (!email) {
    return res
      .status(400)
      .json(new ApiResponse(422, "Please enter valid email address"));
  }

  // Finding business corresponding to email address
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new ApiResponse(404, "User does not exist!!"));
  }

  if (user.isVerified === false) {
    return res
      .status(422)
      .json(new ApiResponse(422, "Kindly verify your account!!"));
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res
      .status(422)
      .json(new ApiResponse(401, "Please enter valid password!!"));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  // Cookie will only be modifiable at backend not in the frontend
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          User: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully!!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("Logout API Called");
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // return response mein updated value milegi
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout Successfully!!"));
});

const getUserOfSameCollege = asyncHandler(async (req, res) => {
  console.log("GetUserOfSameCollege API Called");
  const userCollegeName = req.user.collegeName;
  const myId = req.user._id;
  const collegeUsers = await User.find({
    collegeName: userCollegeName,
    _id: { $ne: myId },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        collegeUsers,
        "Same College User details fetched successfully!!!"
      )
    );
});

const sendOtpEmail = async (fullName, email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Forgot Password OTP",

    // What ever you want to send here
    html:
      "<p>Hii " +
      fullName +
      ", please use this otp " +
      otp +
      " to reset your password.</p>",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email for registration:", error);
    throw new ApiError(
      400,
      "Something went wrong while sending verification email for registration"
    );
  }
};

// While we forgot the password this will check if the user exist or not
const userExist = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new ApiResponse(404, "User does not exist!!"));
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  await User.updateOne(
    { _id: user._id },
    {
      $set: { otp, otpExpiresAt: Date.now() + 10 * 60 * 1000 }, // OTP valid for 10 minutes
    }
  );

  sendOtpEmail(user.fullName, email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, "User exist and otp has been sent to email!!"));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { otp: enteredOtp, email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new ApiResponse(404, "User does not exist!!"));
  }

  if (user.otp !== enteredOtp) {
    return res.status(500).json(new ApiResponse(404, "Otp does not match!!"));
  }

  if (Date.now() >= user.otpExpiresAt) {
    return res.status(500).json(new ApiResponse(404, "Otp expired!!"));
  }

  user.password = password;
  user.otp = null;
  user.otpExpiresAt = null;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully!!"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  sendVerificationEmail,
  refreshAccessToken,
  getUserOfSameCollege,
  userExist,
  forgotPassword,
};
