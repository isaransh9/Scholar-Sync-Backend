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
  likes: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

export const Job = mongoose.model('Job', jobSchema);