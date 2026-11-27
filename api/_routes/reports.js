// api/_routes/reports.js
import express from 'express';
import Report from '../_models/Report.js';
import { requireAuth, requireAdmin } from '../_middleware/auth.js';

const router = express.Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const VALID_STATUSES = ['New', 'In progress', 'Resolved'];

// GET /api/reports (Member sees own; Admin sees all)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = req.user.role === 'admin' ? {} : { reportedBy: req.user._id };

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { title: regex },
        { details: regex },
        { category: regex },
        { place: regex },
        { status: regex },
      ];
    }

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json(reports);
  } catch {
    res.status(500).json({ message: 'Failed to load problem reports.' });
  }
});

// POST /api/reports (Member+)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, details, category, place } = req.body;
    if (!title?.trim() || !details?.trim() || !category?.trim() || !place?.trim()) {
      return res.status(400).json({ message: 'All problem report fields are required.' });
    }

    const report = await Report.create({
      title: title.trim(),
      details: details.trim(),
      category: category.trim(),
      place: place.trim(),
      status: 'New',
      reportedBy: req.user._id,
    });

    const populated = await report.populate('reportedBy', 'name email');
    res.status(201).json({
      message: 'Problem report submitted successfully!',
      report: populated,
    });
  } catch {
    res.status(500).json({ message: 'Failed to submit problem report.' });
  }
});

// PATCH /api/reports/:id/status (Admin only)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Status must be New, In progress, or Resolved.',
      });
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');

    if (!updated) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.json({
      message: `Report status updated to "${status}".`,
      report: updated,
    });
  } catch {
    res.status(500).json({ message: 'Failed to update report status.' });
  }
});

export default router;