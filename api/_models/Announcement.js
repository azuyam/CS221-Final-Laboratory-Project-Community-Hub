import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    datePosted: { type: Date, default: Date.now },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);