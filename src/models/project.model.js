import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  projectTitle: {
    type: String,
  },
  description: {
    type: String,
  },
  projectLink: {
    type: String,
  },
  skills: [
    {
      type: String,
    }
  ],
}, {
  timestamps: true
});

export const Project = mongoose.model('Project', projectSchema);