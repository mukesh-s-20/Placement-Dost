import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from '../models/repository.js';
import { POINTS_CONFIG } from '../config/pointsConfig.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

// Helper to sanitize input strings
const sanitize = (str, maxLen = 100) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '').slice(0, maxLen);
};

// Google OAuth Authentication
router.post('/google', async (req, res) => {
  try {
    const { credential, email, name, picture } = req.body;
    let googleEmail = email;
    let googleName = name;
    let googlePicture = picture;

    // If Google ID Token is provided, verify it
    if (credential) {
      try {
        if (process.env.GOOGLE_CLIENT_ID) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
          });
          const payload = ticket.getPayload();
          googleEmail = payload.email;
          googleName = payload.name;
          googlePicture = payload.picture;
        } else {
          // Decode safely from JWT payload
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            googleEmail = payload.email || googleEmail;
            googleName = payload.name || googleName;
            googlePicture = payload.picture || googlePicture;
          }
        }
      } catch (tokenErr) {
        console.warn('Google token verification fallback:', tokenErr.message);
      }
    }

    if (!googleEmail) {
      return res.status(400).json({ error: 'Valid Google email is required for authentication.' });
    }

    // Check if user already exists
    let user = await Repository.getUserByEmail(googleEmail);
    let isNewUser = false;

    if (!user) {
      // Register new user via Google
      isNewUser = true;
      user = await Repository.createUser({
        name: sanitize(googleName || 'Student', 60),
        email: sanitize(googleEmail.toLowerCase(), 100),
        avatar: googlePicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleName || 'student')}`,
        college: 'Chennai Institute of Technology',
        department: 'Computer Science & Engineering',
        interestArea: 'Data Structures & Algorithms',
        topCareerChoice: 'SDE (Tier-1)',
        keyInterestTopics: ['Binary Search Trees', 'Graph Algorithms', 'System Design'],
        points: 15, // Google sign-up bonus
        streakDaily: 1,
        streakWeekly: 1,
        freeExitsRemaining: POINTS_CONFIG.FREE_EXITS_ALLOWED
      });

      await Repository.addPoints(
        user.id,
        15,
        'GOOGLE_AUTH_WELCOME',
        'Signed up via Google Account! +15 welcome points.'
      );
    } else {
      // Existing user daily login check
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = user.lastLoginDate ? user.lastLoginDate.split('T')[0] : null;

      if (lastLogin !== today) {
        await Repository.addPoints(user.id, POINTS_CONFIG.DAILY_LOGIN, 'DAILY_LOGIN', 'Daily login consistency bonus');
        await Repository.updateUser(user.id, {
          lastLoginDate: new Date().toISOString(),
          streakDaily: (user.streakDaily || 0) + 1,
          freeExitsRemaining: POINTS_CONFIG.FREE_EXITS_ALLOWED
        });
      }
    }

    const finalUser = await Repository.getUserById(user.id);
    res.json({
      success: true,
      user: finalUser,
      isNewUser,
      message: isNewUser ? 'Welcome to Placement Dost! Google account registered.' : 'Signed in with Google successfully.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new student (Onboarding step 1)
router.post('/register', async (req, res) => {
  try {
    const { name, age, college, department, interestArea, topCareerChoice, keyInterestTopics, email } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const cleanName = sanitize(name, 60);
    const cleanCollege = sanitize(college || 'Chennai Institute of Technology', 80);
    const cleanEmail = email ? sanitize(email.toLowerCase(), 100) : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@${cleanCollege.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`;

    const existing = await Repository.getUserByEmail(cleanEmail);
    if (existing) {
      return res.json({ user: existing, message: 'Existing profile found' });
    }

    const parsedAge = parseInt(age);
    const validatedAge = (!isNaN(parsedAge) && parsedAge >= 16 && parsedAge <= 60) ? parsedAge : 20;

    const user = await Repository.createUser({
      name: cleanName,
      age: validatedAge,
      college: cleanCollege,
      department: sanitize(department || 'Computer Science & Engineering', 80),
      interestArea: sanitize(interestArea || 'Machine Learning & AI', 80),
      topCareerChoice: sanitize(topCareerChoice || 'AI Engineer', 80),
      keyInterestTopics: Array.isArray(keyInterestTopics) ? keyInterestTopics.map(t => sanitize(t, 50)) : [interestArea || 'Machine Learning'],
      email: cleanEmail,
      points: 10, // Welcome points
      streakDaily: 1,
      streakWeekly: 1,
      freeExitsRemaining: POINTS_CONFIG.FREE_EXITS_ALLOWED
    });

    await Repository.addPoints(user.id, 10, 'WELCOME_BONUS', 'Welcome to Placement Dost! +10 onboarding bonus.');

    res.status(201).json({ user, message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Existing user login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const cleanEmail = sanitize(email.toLowerCase(), 100);
    const user = await Repository.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please register via Onboarding.' });
    }

    // Daily login bonus check
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.lastLoginDate ? user.lastLoginDate.split('T')[0] : null;
    let pointsAwarded = false;

    if (lastLogin !== today) {
      await Repository.addPoints(user.id, POINTS_CONFIG.DAILY_LOGIN, 'DAILY_LOGIN', 'Daily login consistency bonus');
      await Repository.updateUser(user.id, {
        lastLoginDate: new Date().toISOString(),
        streakDaily: (user.streakDaily || 0) + 1,
        freeExitsRemaining: POINTS_CONFIG.FREE_EXITS_ALLOWED // Reset free exits daily
      });
      pointsAwarded = true;
    }

    const updatedUser = await Repository.getUserById(user.id);
    res.json({ user: updatedUser, pointsAwarded, message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/me/:id', async (req, res) => {
  try {
    const user = await Repository.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo users list for quick switching & testing
router.get('/demo-users', async (req, res) => {
  try {
    const users = await Repository.getUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
