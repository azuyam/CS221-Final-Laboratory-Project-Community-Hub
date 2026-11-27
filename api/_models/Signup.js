import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema(
  {
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

signupSchema.index({ activity: 1, member: 1 }, { unique: true });

export default mongoose.models.Signup || mongoose.model('Signup', signupSchema);