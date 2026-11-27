// api/_routes/announcements.js
import express from 'express';
import Announcement from '../_models/Announcement.js';
import { requireAuth, requireAdmin } from '../_middleware/auth.js';

const router = express.Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/announcements (Public + Search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: regex }, { message: regex }, { category: regex }];
    }

    const announcements = await Announcement.find(filter)
      .populate('postedBy', 'name')
      .sort({ datePosted: -1, createdAt: -1 });

    res.json(announcements);
  } catch {
    res.status(500).json({ message: 'Failed to load announcements.' });
  }
});

// POST /api/announcements (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, message, category } = req.body;
    if (!title?.trim() || !message?.trim() || !category?.trim()) {
      return res.status(400).json({ message: 'Title, message, and category are required.' });
    }

    const created = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      category: category.trim(),
      postedBy: req.user._id,
    });

    const populated = await created.populate('postedBy', 'name');
    res.status(201).json({
      message: 'Announcement created successfully!',
      announcement: populated,
    });
  } catch {
    res.status(500).json({ message: 'Failed to create announcement.' });
  }
});

// PUT /api/announcements/:id (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, message, category } = req.body;
    if (!title?.trim() || !message?.trim() || !category?.trim()) {
      return res.status(400).json({ message: 'Title, message, and category are required.' });
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title: title.trim(), message: message.trim(), category: category.trim() },
      { new: true, runValidators: true }
    ).populate('postedBy', 'name');

    if (!updated) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.json({
      message: 'Announcement updated successfully!',
      announcement: updated,
    });
  } catch {
    res.status(500).json({ message: 'Failed to update announcement.' });
  }
});

// DELETE /api/announcements/:id (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }
    res.json({ message: 'Announcement deleted successfully!' });
  } catch {
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
});

export default router;