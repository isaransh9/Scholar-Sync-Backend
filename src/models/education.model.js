import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  university: {
    type: String,
  },
  degree: {
    type: String,
  },
  grade: {
    type: Number,
  },
  fieldOfStudy: {
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
});

export const Education = mongoose.model('Education', educationSchema);