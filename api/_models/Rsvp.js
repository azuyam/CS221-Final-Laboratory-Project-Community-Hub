import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

rsvpSchema.index({ event: 1, member: 1 }, { unique: true });

export default mongoose.models.Rsvp || mongoose.model('Rsvp', rsvpSchema);