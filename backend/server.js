import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { seedDatabase } from './data/seed.js';
import { POINTS_CONFIG, TRACKS } from './config/pointsConfig.js';
import { RUBRIC_DIMENSIONS } from './config/rubricConfig.js';
import { Repository } from './models/repository.js';

import authRoutes from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import dsaRoutes from './routes/dsaRoutes.js';
import peerRoutes from './routes/peerRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import focusRoutes from './routes/focusRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow embedded educational YouTube players and external assets
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Config and rubric introspection endpoints
app.get('/api/config/points', (req, res) => {
  res.json({ pointsConfig: POINTS_CONFIG, tracks: TRACKS });
});

app.get('/api/config/rubric', (req, res) => {
  res.json({ rubricDimensions: RUBRIC_DIMENSIONS });
});

// Points ledger audit endpoint
app.get('/api/points/ledger/:userId?', async (req, res) => {
  try {
    const ledger = await Repository.getPointsLedger(req.params.userId);
    res.json({ ledger });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Placement Dost - AI-Personalized Placement Prep Platform',
    timestamp: new Date().toISOString()
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/peer', peerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/focus', focusRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database, seed data, and start server
const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Placement Dost API Server running on port ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
};

startServer();
