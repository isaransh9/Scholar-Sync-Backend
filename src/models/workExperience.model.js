import mongoose from "mongoose";

const workExperienceSchema = new mongoose.Schema({
  companyName: {
    type: String,
  },
  certificateLink: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  }
}, {
  timestamps: true
})

export const WorkExperience = mongoose.model('WorkExperience', workExperienceSchema);