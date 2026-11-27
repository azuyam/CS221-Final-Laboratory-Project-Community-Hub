// api/_routes/admin.js
import express from 'express';
import User from '../_models/User.js';
import Announcement from '../_models/Announcement.js';
import Event from '../_models/Event.js';
import Report from '../_models/Report.js';
import Activity from '../_models/Activity.js';
import { requireAuth, requireAdmin } from '../_middleware/auth.js';

const router = express.Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lock every route in this file to logged-in Admins only
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [
      users,
      announcements,
      events,
      activities,
      reportsTotal,
      reportsNew,
      reportsInProgress,
      reportsResolved,
    ] = await Promise.all([
      User.countDocuments(),
      Announcement.countDocuments(),
      Event.countDocuments(),
      Activity.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'New' }),
      Report.countDocuments({ status: 'In progress' }),
      Report.countDocuments({ status: 'Resolved' }),
    ]);

    res.json({
      users,
      announcements,
      events,
      activities,
      reports: {
        total: reportsTotal,
        new: reportsNew,
        inProgress: reportsInProgress,
        resolved: reportsResolved,
      },
    });
  } catch {
    res.status(500).json({ message: 'Failed to load dashboard counts.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { role: regex }];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch {
    res.status(500).json({ message: 'Failed to load users.' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be member or admin.' });
    }

    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin access.' });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: `${updated.name} is now ${role === 'admin' ? 'an Admin' : 'a Member'}.`,
      user: updated,
    });
  } catch {
    res.status(500).json({ message: 'Failed to update user role.' });
  }
});

export default router;