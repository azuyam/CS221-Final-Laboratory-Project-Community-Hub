import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    place: { type: String, required: true, trim: true },
    maxPeople: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model('Event', eventSchema);