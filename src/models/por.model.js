import mongoose from "mongoose";

const porSchema = new mongoose.Schema({
  positionOfResponsibility: {
    type: String,
  },
  institute: {
    type: String,
  }
}, {
  timestamps: true
});

export const POR = mongoose.model('POR',porSchema);