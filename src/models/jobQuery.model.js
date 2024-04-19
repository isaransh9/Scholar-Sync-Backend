import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  titleOfJob: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  typeOfJob: {
    type: String,
    required : true,
    enum :['remote','onsite']
  },
  domain: [
    {
      type: String,
    }
  ],
  moreAboutJob: { // PDF file URL
    type: String,
    required: true
  },
  stipend: {
    type: Number,
    default: 0,
  },
  durationInMonths: {
    type: Number,
    required: true
  },
  lastDate: {
    type: Date,
    required: true
  },
  likes: {
    type: Number,
    default: 0,
  },
  appliedBy: [
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    }
  ]
}, { timestamps: true });

export const Job = mongoose.model('Job', jobSchema);