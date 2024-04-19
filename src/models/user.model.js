import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    fullName: {
      required: [true, "Fullname is required"],
      type: String,
    },
    email: {
      required: [true, "Email is required"],
      type: String,
      unique: true,
    },
    collegeName: {
      type: String,
      required: [true, "College Name is required"],
    },
    programmeName: {
      // Not on signup page
      type: String,
      enum: ["B.E.", "B. Tech", "other"],
    },
    branchName: {
      // Not on Signup page
      type: String,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    profilePicture: {
      // Not on Signup page
      type: String, // Cloudinary Url
      default: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    domain: [
      {
        type: String,
      },
    ],
    aboutMe: {
      // Not on signup page
      type: String,
    },
    openings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['student', 'professor'],
      required: true,
    },
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      }
    ],
    profileSection: {
      education: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Education"
        }
      ],
      project: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project"
        }
      ],
      positionOfResponsibility: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "POR"
        }
      ],
      workExperience: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WorkExperience"
        }
      ],
      certificate: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Certificate"
        }
      ],
      skills: [
        {
          type:String
        }
      ]
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // if it not modified then return
  this.password = await bcrypt.hash(this.password, 10); // 10 rounds of algorithm
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password); // Check if password is correct
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
