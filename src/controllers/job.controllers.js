import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Job } from "../models/jobQuery.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadOpenings = asyncHandler(async (req, res) => {
  console.log("uploadOpenings API Called");
  const {
    titleOfJob,
    domain,
    stipend,
    isRemote,
    isOnSite,
    durationInMonths,
    lastDate,
    detailsLink,
  } = req.body;
  // console.log(req.body);
  const topics = domain.split(",");
  let typeOfJob;
  if (isRemote) {
    typeOfJob = "remote";
  } else {
    typeOfJob = "onsite";
  }

  if (!titleOfJob || !durationInMonths || !lastDate) {
    throw new ApiError(400, "All fields are required!!");
  }

  const detailsLocalPath = req.files?.detailsLink[0]?.path;

  if (!detailsLocalPath) {
    throw new ApiError(400, "File is required!!");
  }

  const fileLink = await uploadOnCloudinary(detailsLocalPath);

  if (!fileLink) {
    throw new ApiError(400, "Failed to upload on cloudinary!!");
  }

  const createdJob = await Job.create({
    titleOfJob,
    user: req.user._id,
    domain: topics,
    moreAboutJob: fileLink.url,
    stipend,
    durationInMonths,
    lastDate,
    typeOfJob,
  });

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { openings: createdJob } },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(500, "Failed to make changes in database!!");
  } else {
    console.log("Post Created Successfully!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Successfully posted job!!"));
});

const userAppliedOnJob = asyncHandler(async (req, res) => {
  console.log("userAppliedOnJob API Called");

  const { jobId } = req.params;
  const job = await Job.findByIdAndUpdate(
    jobId,
    { $push: { appliedBy: req.user._id } },
    { new: true }
  );

  if (!job) {
    throw new ApiError(404, "Job not found!!");
  }
  const jobOwnerId = job.user;

  const createNotification = await Notification.create({
    generatedBy: req.user._id,
    generatedFor: jobOwnerId,
    message: `${req.user.fullName} from ${req.user.collegeName} applied on your job titled "${job.titleOfJob}"`,
  });

  if (!createNotification) {
    throw new ApiError(500, "Failed to create notification!!");
  }

  const updateOwner = await User.findByIdAndUpdate(
    jobOwnerId,
    { $push: { notifications: createNotification._id } },
    { new: true }
  );

  if (!updateOwner) {
    throw new ApiError(500, "Failed update owner data!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully applied on job!!"));
});

const getAllJobPost = asyncHandler(async (req, res) => {
  console.log("getAllJobPost API Called");

  const myId = req.user._id;
  const user = await User.findById(req.user._id);
  const posts = await Job.find({
    user: { $ne: myId },
    appliedBy: { $nin: [myId] },
  })
    .sort({ createdAt: -1 })
    .populate("user");
  return res
    .status(200)
    .json(new ApiResponse(200, posts, "Details fetched successfully!!!"));
});

const getJobsOfSameCollege = asyncHandler(async (req, res) => {
  console.log("getJobsOfSameCollege API Called");

  const userCollegeName = req.user.collegeName;
  const currentUserID = req.user._id;
  const jobs = await Job.aggregate([
    // Match jobs created by users from the same college
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $match: {
        "user.collegeName": userCollegeName,
      },
    },
    // Exclude jobs where the current user has already applied
    {
      $match: {
        appliedBy: { $ne: currentUserID },
      },
    },
    // Optionally, add more stages like sorting, limiting, etc.
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, "Details fetched successfully!!!"));
});

const getPreviousPost = asyncHandler(async (req, res) => {
  console.log("getPreviousPost API Called");

  const openingIds = req.user.openings;
  const getJobs = await Job.find({ _id: { $in: openingIds } });
  return res
    .status(200)
    .json(new ApiResponse(200, getJobs, "Details fetched successfully!!!"));
});

export {
  uploadOpenings,
  getAllJobPost,
  getJobsOfSameCollege,
  getPreviousPost,
  userAppliedOnJob,
};
