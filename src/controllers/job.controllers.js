import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Job } from "../models/jobQuery.model.js";
import { User } from "../models/user.model.js";

const uploadOpenings = asyncHandler(async (req, res) => {
  const { titleOfJob, domain, stipend, isRemote, isOnSite, durationInMonths, lastDate, detailsLink } = req.body;

  let typeOfJob;
  if (isRemote) {
    typeOfJob = "remote";
  }
  else {
    typeOfJob = "onsite";
  }

  if (!titleOfJob || !durationInMonths || !lastDate) {
    throw new ApiError(400, 'All fields are required!!');
  }

  const createdJob = await Job.create({
    titleOfJob,
    user: req.user._id,
    domain,
    moreAboutJob: detailsLink,
    stipend,
    durationInMonths,
    lastDate,
    typeOfJob,
  });

  const updatedUser = await User.findByIdAndUpdate(req.user._id, { $push: { openings: createdJob } }, { new: true }).select('-password -refreshToken');

  if (!updatedUser) {
    throw new ApiError(500, 'Failed to make changes in database!!');
  }

  return res.status(200).json(
    new ApiResponse(200, updatedUser, 'Successfully posted job!!')
  )
})

const getAllJobPost = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const user = await User.findById(req.user._id);
  const posts = await Job.find({ user: { $ne: myId } })
    .sort({ createdAt: -1 }) // Sort by createdAt field in descending order to get the latest posts first
    .populate('user');
  return res.status(200).json(
    new ApiResponse(200, posts, 'Details fetched successfully!!!')
  )
})

const getJobsOfSameCollege = asyncHandler(async (req, res) => {
  const userCollegeName = req.user.collegeName;

  const jobs = await Job.aggregate([
    {
      $lookup: {
        from: 'users', // name of the user collection
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $match: {
        'user.collegeName': userCollegeName,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, jobs, 'Details fetched successfully!!!')
  )
})

const getPreviousPost = asyncHandler(async (req, res) => {
  const openingIds = req.user.openings;
  const getJobs = await Job.find({ _id: { $in: openingIds } });
  return res.status(200).json(
    new ApiResponse(200, getJobs, 'Details fetched successfully!!!')
  );
})

export { uploadOpenings, getAllJobPost, getJobsOfSameCollege, getPreviousPost }