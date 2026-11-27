import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    slots: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema);