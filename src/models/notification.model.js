import mongoose from "mongoose";

const notiSchema = new mongoose.Schema({
  generatedBy : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  generatedFor : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  }
}, { timestamps: true });

export const Job = mongoose.model('Notification', notiSchema);