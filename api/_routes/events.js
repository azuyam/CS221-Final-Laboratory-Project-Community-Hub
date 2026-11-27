// api/_routes/events.js
import express from 'express';
import Event from '../_models/Event.js';
import Rsvp from '../_models/Rsvp.js';
import { optionalAuth, requireAuth, requireAdmin } from '../_middleware/auth.js';

const router = express.Router();
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/events (Public + optionalAuth to know if user joined)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search?.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: regex }, { details: regex }, { place: regex }];
    }

    const events = await Event.find(filter).sort({ date: 1 });
    const eventIds = events.map((e) => e._id);
    const rsvps = await Rsvp.find({ event: { $in: eventIds } });

    const enriched = events.map((ev) => {
      const eventRsvps = rsvps.filter((r) => r.event.equals(ev._id));
      const hasJoined = req.user
        ? eventRsvps.some((r) => r.member.equals(req.user._id))
        : false;

      return {
        ...ev.toObject(),
        rsvpCount: eventRsvps.length,
        hasJoined,
      };
    });

    res.json(enriched);
  } catch {
    res.status(500).json({ message: 'Failed to load events.' });
  }
});

// POST /api/events (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, details, date, place, maxPeople } = req.body;
    if (!title?.trim() || !details?.trim() || !date || !place?.trim() || !maxPeople) {
      return res.status(400).json({ message: 'All event fields are required.' });
    }
    if (Number(maxPeople) < 1) {
      return res.status(400).json({ message: 'Maximum people must be at least 1.' });
    }

    const event = await Event.create({
      title: title.trim(),
      details: details.trim(),
      date,
      place: place.trim(),
      maxPeople: Number(maxPeople),
    });

    res.status(201).json({
      message: 'Event created successfully!',
      event: { ...event.toObject(), rsvpCount: 0, hasJoined: false },
    });
  } catch {
    res.status(500).json({ message: 'Failed to create event.' });
  }
});

// PUT /api/events/:id (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, details, date, place, maxPeople } = req.body;
    if (!title?.trim() || !details?.trim() || !date || !place?.trim() || !maxPeople) {
      return res.status(400).json({ message: 'All event fields are required.' });
    }
    if (Number(maxPeople) < 1) {
      return res.status(400).json({ message: 'Maximum people must be at least 1.' });
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        details: details.trim(),
        date,
        place: place.trim(),
        maxPeople: Number(maxPeople),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.json({ message: 'Event updated successfully!', event: updated });
  } catch {
    res.status(500).json({ message: 'Failed to update event.' });
  }
});

// DELETE /api/events/:id (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    await Rsvp.deleteMany({ event: deleted._id });
    res.json({ message: 'Event deleted successfully!' });
  } catch {
    res.status(500).json({ message: 'Failed to delete event.' });
  }
});

// POST /api/events/:id/rsvp (Member+)
router.post('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const existing = await Rsvp.findOne({ event: event._id, member: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already joined this event.' });
    }

    const currentCount = await Rsvp.countDocuments({ event: event._id });
    if (currentCount >= event.maxPeople) {
      return res.status(400).json({ message: 'Sorry, this event is already full.' });
    }

    await Rsvp.create({ event: event._id, member: req.user._id });
    res.status(201).json({ message: 'You have joined the event!' });
  } catch {
    res.status(500).json({ message: 'Failed to join event.' });
  }
});

// DELETE /api/events/:id/rsvp (Member+)
router.delete('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const removed = await Rsvp.findOneAndDelete({
      event: req.params.id,
      member: req.user._id,
    });
    if (!removed) {
      return res.status(404).json({ message: 'You have not joined this event.' });
    }
    res.json({ message: 'You have left the event.' });
  } catch {
    res.status(500).json({ message: 'Failed to leave event.' });
  }
});

export default router;