// api/_routes/activities.js
import express from 'express';
import Activity from '../_models/Activity.js';
import Signup from '../_models/Signup.js';
import { optionalAuth, requireAuth, requireAdmin } from '../_middleware/auth.js';

const router = express.Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/activities
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: regex }, { details: regex }];
    }

    const activities = await Activity.find(filter).sort({ date: 1 });
    const activityIds = activities.map((a) => a._id);
    const signups = await Signup.find({ activity: { $in: activityIds } });

    const enriched = activities.map((act) => {
      const actSignups = signups.filter((s) => s.activity.equals(act._id));
      const hasSignedUp = req.user
        ? actSignups.some((s) => s.member.equals(req.user._id))
        : false;

      return {
        ...act.toObject(),
        signupCount: actSignups.length,
        hasSignedUp,
      };
    });

    res.json(enriched);
  } catch {
    res.status(500).json({ message: 'Failed to load volunteer activities.' });
  }
});

// POST /api/activities (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, details, date, slots } = req.body;
    if (!title?.trim() || !details?.trim() || !date || !slots) {
      return res.status(400).json({ message: 'All volunteer activity fields are required.' });
    }
    if (Number(slots) < 1) {
      return res.status(400).json({ message: 'Number of slots must be at least 1.' });
    }

    const activity = await Activity.create({
      title: title.trim(),
      details: details.trim(),
      date,
      slots: Number(slots),
    });

    res.status(201).json({
      message: 'Volunteer activity created successfully!',
      activity: { ...activity.toObject(), signupCount: 0, hasSignedUp: false },
    });
  } catch {
    res.status(500).json({ message: 'Failed to create volunteer activity.' });
  }
});

// PUT /api/activities/:id (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, details, date, slots } = req.body;
    if (!title?.trim() || !details?.trim() || !date || !slots) {
      return res.status(400).json({ message: 'All volunteer activity fields are required.' });
    }
    if (Number(slots) < 1) {
      return res.status(400).json({ message: 'Number of slots must be at least 1.' });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        details: details.trim(),
        date,
        slots: Number(slots),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Volunteer activity not found.' });
    }

    res.json({ message: 'Volunteer activity updated successfully!', activity: updated });
  } catch {
    res.status(500).json({ message: 'Failed to update volunteer activity.' });
  }
});

// DELETE /api/activities/:id (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Activity.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Volunteer activity not found.' });
    }
    await Signup.deleteMany({ activity: deleted._id });
    res.json({ message: 'Volunteer activity deleted successfully!' });
  } catch {
    res.status(500).json({ message: 'Failed to delete volunteer activity.' });
  }
});

// POST /api/activities/:id/signup (Member+)
router.post('/:id/signup', requireAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Volunteer activity not found.' });
    }

    const existing = await Signup.findOne({ activity: activity._id, member: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already signed up for this activity.' });
    }

    const currentCount = await Signup.countDocuments({ activity: activity._id });
    if (currentCount >= activity.slots) {
      return res.status(400).json({ message: 'Sorry, all volunteer slots are full.' });
    }

    await Signup.create({ activity: activity._id, member: req.user._id });
    res.status(201).json({ message: 'Successfully signed up to volunteer!' });
  } catch {
    res.status(500).json({ message: 'Failed to sign up for volunteer activity.' });
  }
});

// DELETE /api/activities/:id/signup (Member+)
router.delete('/:id/signup', requireAuth, async (req, res) => {
  try {
    const removed = await Signup.findOneAndDelete({
      activity: req.params.id,
      member: req.user._id,
    });
    if (!removed) {
      return res.status(404).json({ message: 'Volunteer sign-up not found.' });
    }
    res.json({ message: 'Volunteer sign-up cancelled.' });
  } catch {
    res.status(500).json({ message: 'Failed to cancel volunteer sign-up.' });
  }
});

export default router;