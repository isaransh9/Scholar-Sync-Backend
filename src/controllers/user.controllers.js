import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
  }
}

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }
  try {
    // Verify Token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
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
      secure: true
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res.status(200)
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
      )
  } catch (error) {
    throw new ApiError(error?.message || "Something went wrong");
  }


})

// Everything is working fine till email verification

const sendVerificationEmail = async (fullName, email, userId) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Verification email',

    // What even you want to send here
    html: '<p>Hii' + fullName + ', please click here to <a href="http://127.0.0.1:8000/api/v1/user/verify?id=' + userId + '"> Verify </a> your mail.</p>'
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new ApiError(400, 'Something went wrong while sending verification email');
  }
}

const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const verifiedUser = await User.updateOne({ _id: req.query.id }, { $set: { isVerified: true } });
    return res.status(200).json(
      new ApiResponse(200, verifiedUser, "User Verified Successfully")
    );
  } catch (error) {
    throw new ApiError(400, 'Failed to send verification email');
  }
})

const registerUser = asyncHandler(async (req, res) => {
  // Algorithm/Procedure that we will be performing to register Businesss
  // get Business detail from the frontend
  // validate the received Business info -- not empty, constraints
  // check if Business already registered -- through Businessname or email
  // check for images received and avatar is must
  // upload them to cloudinary server
  // create Business object -- entry in db
  // remove hashed password, refresh token from response object
  // check for Business creation 
  // return res

  const { fullName, email, collegeName, phoneNumber, domain, password } = req.body;  // getting Business details
  console.log(req.body);

  if (
    [fullName, email, collegeName, phoneNumber, password].some((field) => field?.trim() === "")
    // Iterates over the items and checks if empty or not
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // ? handles if it do not exist
  // Getting the path to the file on local server which is saved by multer
  const profilePictureLocalPath = req.files?.profilePicture[0]?.path;


  // if local path exist then kindly upload it to cloudinary
  var profilePicture = null;
  if (profilePictureLocalPath) {
    profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
    if (!profilePicture) {
      throw new ApiError(400, "Failed to upload profile picture on cloudinary");
    }
  }


  // Creating instance of Business and storing the details in the DB
  const user = await User.create({
    fullName,
    email,
    collegeName,
    phoneNumber,
    domain,
    profilePicture: profilePicture?.url,
    password
  });

  // if Business is created then select all by default and remove password and refreshToken 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  sendVerificationEmail(fullName, email, createdUser._id);

  return res.status(200).json(
    new ApiResponse(200, createdUser, "User created successfully")
  );
})

const loginUser = asyncHandler(async (req, res) => {
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
    throw new ApiError(400, "Email is required");
  }

  // Finding business corresponding to email address
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist!!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password!!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findOne(user._id).select("-password -refreshToken");

  // Cookie will only be modifiable at backend not in the frontend
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          User: loggedInUser, accessToken, refreshToken
        },
        "User Logged In Successfully!!"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      }
    },
    {
      new: true // return response mein updated value milegi
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "User logout Successfully!!")
    )
})

const uploadUserProfilePicture = asyncHandler(async (req, res) => {
  //Extracting the local path of the file
  const profilePictureLocalPath = req.files?.profilePicture[0]?.path;

  // if local path does not exist that means file DNE on server
  if (!profilePictureLocalPath) {
    throw new ApiError(404, "Kindly attach profile picture");
  }

  // Upload file on cloudinary
  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

  // If url not received from cloudinary
  if (!profilePicture) {
    throw new ApiError(400, 'Failed to upload picture on cloudinary!!');
  }

  // if everything is perfect then update the url received from cloudinary
  const updatedUser = await User.findByIdAndUpdate(req.user._id, { profilePicture: profilePicture?.url }, { new: true }).select("-password -refreshToken");
  // Here due to {new : true}, we will get the updated user

  return res.status(200).json(
    new ApiResponse(200, updatedUser, "Profile Picture uploaded successfully")
  );

})

export { registerUser, loginUser, logoutUser, verifyEmail, sendVerificationEmail, uploadUserProfilePicture, refreshAccessToken }
