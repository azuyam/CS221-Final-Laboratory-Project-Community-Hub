import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['New', 'In progress', 'Resolved'],
      default: 'New',
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model('Report', reportSchema);