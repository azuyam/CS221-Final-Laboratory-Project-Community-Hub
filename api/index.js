// api/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './_db.js';
import authRoutes from './_routes/auth.js';
import announcementRoutes from './_routes/announcements.js';
import eventRoutes from './_routes/events.js';
import reportRoutes from './_routes/reports.js';
import activityRoutes from './_routes/activities.js';
import adminRoutes from './_routes/admin.js';

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB on every API request (uses cached connection)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB error:', err.message);
    res.status(500).json({ message: 'Database connection failed.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CommunityHub API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/admin', adminRoutes);

// Catch unknown /api routes cleanly
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

export default app;