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

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.'
  }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --------------------------------------------------
// Database initialization
// --------------------------------------------------

let dbInitialized = false;

const initializeDatabase = async () => {
  if (!dbInitialized) {
    await connectDB();
    await seedDatabase();
    dbInitialized = true;
    console.log('Database initialized');
  }
};

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get('/api/health', async (req, res) => {
  try {
    await initializeDatabase();

    res.json({
      status: 'online',
      app: 'Placement Dost - AI-Personalized Placement Prep Platform',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check database error:', error);

    res.status(500).json({
      status: 'offline',
      error: error.message
    });
  }
});

// --------------------------------------------------
// Config endpoints
// --------------------------------------------------

app.get('/api/config/points', async (req, res) => {
  try {
    await initializeDatabase();

    res.json({
      pointsConfig: POINTS_CONFIG,
      tracks: TRACKS
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get('/api/config/rubric', async (req, res) => {
  try {
    await initializeDatabase();

    res.json({
      rubricDimensions: RUBRIC_DIMENSIONS
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// Points ledger
// --------------------------------------------------

app.get('/api/points/ledger/:userId?', async (req, res) => {
  try {
    await initializeDatabase();

    const ledger = await Repository.getPointsLedger(req.params.userId);

    res.json({
      ledger
    });
  } catch (error) {
    console.error('Ledger error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/peer', peerRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/focus', focusRoutes);

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

// --------------------------------------------------
// Vercel
// --------------------------------------------------

export default app;

// --------------------------------------------------
// Local development
// --------------------------------------------------

if (process.env.NODE_ENV !== 'production') {
  initializeDatabase()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log('=======================================================');
        console.log(`🚀 Placement Dost API Server running on port ${PORT}`);
        console.log(`📍 Endpoint: http://localhost:${PORT}/api/health`);
        console.log('=======================================================');
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(
            `Port ${PORT} is already in use by another running instance.`
          );
          process.exit(1);
        } else {
          console.error('Server error:', err);
        }
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
    });
}