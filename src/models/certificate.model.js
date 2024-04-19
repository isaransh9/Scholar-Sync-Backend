import mongoose from "mongoose";

const certificate = new mongoose.Schema({
  title: {
    type: String,
  },
  certificateLink: {
    type: String,
  },
  description: {
    type: String,
  }
}, {
  timestamps: true
})

export const Certificate = mongoose.model('Certificate', certificate);