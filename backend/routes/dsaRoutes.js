import express from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { Repository } from '../models/repository.js';
import { POINTS_CONFIG } from '../config/pointsConfig.js';

const router = express.Router();

// Secure multer configuration: 5MB limit, strict file type filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = (file.originalname || '').toLowerCase();
    const isAllowed = allowedExtensions.some(ext => lowerName.endsWith(ext));
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are supported.'));
    }
  }
});

// Get all DSA problems
router.get('/problems', async (req, res) => {
  try {
    const problems = await Repository.getDsaProblems();
    const { difficulty, topic, sourceSheet, search } = req.query;

    let filtered = [...problems];
    if (difficulty && difficulty !== 'All') {
      filtered = filtered.filter(p => p.difficulty?.toLowerCase() === difficulty.toLowerCase());
    }
    if (topic && topic !== 'All') {
      filtered = filtered.filter(p => p.topic?.toLowerCase().includes(topic.toLowerCase()));
    }
    if (sourceSheet && sourceSheet !== 'All') {
      filtered = filtered.filter(p => p.sourceSheet === sourceSheet);
    }
    if (search) {
      const cleanSearch = String(search).trim().toLowerCase();
      filtered = filtered.filter(p => 
        (p.title && p.title.toLowerCase().includes(cleanSearch)) || 
        (p.description && p.description.toLowerCase().includes(cleanSearch))
      );
    }

    res.json({ problems: filtered, total: filtered.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user DSA progress & daily requirement status
router.get('/user-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await Repository.getDsaProgress(userId);
    const user = await Repository.getUserById(userId);

    const todayStr = new Date().toISOString().split('T')[0];
    const solvedToday = progress.some(p => p.solvedAt?.startsWith(todayStr));

    res.json({
      progress,
      solvedCount: progress.length,
      solvedToday,
      dailyStreak: user?.streakDaily || 1,
      weeklyStreak: user?.streakWeekly || 1,
      points: user?.points || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record a solved problem and award gamification points
router.post('/solve', async (req, res) => {
  try {
    const { userId, problemId, difficulty, isLate, sourceSheet, code, language } = req.body;
    if (!userId || !problemId) {
      return res.status(400).json({ error: 'userId and problemId are required' });
    }

    // Determine points according to config table
    let points = 0;
    let actionType = 'SOLVE_DSA';
    const diff = (difficulty || 'Easy').toLowerCase();

    if (isLate) {
      points = POINTS_CONFIG.COMPLETE_OVERDUE_PROBLEM;
      actionType = 'COMPLETE_OVERDUE_PROBLEM';
    } else {
      if (diff === 'easy') {
        points = POINTS_CONFIG.SOLVE_DSA_EASY;
        actionType = 'SOLVE_DSA_EASY';
      } else if (diff === 'medium') {
        points = POINTS_CONFIG.SOLVE_DSA_MEDIUM;
        actionType = 'SOLVE_DSA_MEDIUM';
      } else if (diff === 'hard') {
        points = POINTS_CONFIG.SOLVE_DSA_HARD;
        actionType = 'SOLVE_DSA_HARD';
      } else {
        points = 3;
      }
    }

    // Record solve in DSAProgress
    const record = await Repository.recordDsaSolve(userId, problemId, difficulty, points, sourceSheet);

    // Update streak and points
    const user = await Repository.getUserById(userId);
    const newStreak = (user?.streakDaily || 0) + 1;
    let streakBonus = 0;

    // Weekly streak bonus (+1 every 7 days)
    if (newStreak % 7 === 0) {
      streakBonus = POINTS_CONFIG.MAINTAIN_DAILY_STREAK;
      await Repository.addPoints(
        userId,
        streakBonus,
        'WEEKLY_STREAK_BONUS',
        `Hit ${newStreak}-day milestone streak! +${streakBonus} bonus.`
      );
      await Repository.updateUser(userId, { streakWeekly: (user.streakWeekly || 0) + 1 });
    }

    // Add problem points to ledger
    const ledger = await Repository.addPoints(
      userId,
      points,
      actionType,
      `Solved ${difficulty} DSA problem: ${problemId} (+${points} pts)`
    );

    await Repository.updateUser(userId, { streakDaily: newStreak });

    res.json({
      success: true,
      pointsEarned: points + streakBonus,
      totalPoints: ledger?.user?.points,
      streakDaily: newStreak,
      record
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import DSA problems from external sources (Excel, CSV, JSON, or paste)
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    let parsedProblems = [];

    if (req.file) {
      const buffer = req.file.buffer;
      const lowerName = (req.file.originalname || '').toLowerCase();

      if (lowerName.endsWith('.csv')) {
        // Safe CSV parsing
        const csvString = buffer.toString('utf-8');
        const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('problem'));
            const diffIdx = headers.findIndex(h => h.includes('diff'));
            const topicIdx = headers.findIndex(h => h.includes('topic') || h.includes('cat'));

            const title = titleIdx !== -1 && values[titleIdx] ? values[titleIdx] : `Problem ${i}`;
            const diff = diffIdx !== -1 && values[diffIdx] ? values[diffIdx] : 'Medium';
            const topic = topicIdx !== -1 && values[topicIdx] ? values[topicIdx] : 'DSA General';

            parsedProblems.push({
              id: `imp_${Date.now()}_${i}`,
              title,
              difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
              topic,
              sourceSheet: req.body.sourceSheet || 'Imported CSV Sheet',
              url: 'https://leetcode.com',
              description: 'Practice problem imported from external sheet.'
            });
          }
        }
      } else {
        // Safe ExcelJS Parsing
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        if (worksheet) {
          let headers = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              headers = row.values.map(v => String(v || '').trim().toLowerCase());
            } else {
              const vals = row.values;
              const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('problem'));
              const diffIdx = headers.findIndex(h => h.includes('diff'));
              const topicIdx = headers.findIndex(h => h.includes('topic') || h.includes('cat'));

              const title = titleIdx !== -1 && vals[titleIdx] ? String(vals[titleIdx]) : `Problem ${rowNumber - 1}`;
              const diff = diffIdx !== -1 && vals[diffIdx] ? String(vals[diffIdx]) : 'Medium';
              const topic = topicIdx !== -1 && vals[topicIdx] ? String(vals[topicIdx]) : 'DSA Practice';

              parsedProblems.push({
                id: `imp_${Date.now()}_${rowNumber}`,
                title,
                difficulty: ['Easy', 'Medium', 'Hard'].includes(diff) ? diff : 'Medium',
                topic,
                sourceSheet: req.body.sourceSheet || 'Imported Excel Sheet',
                url: 'https://leetcode.com',
                description: 'Practice challenge imported from external workbook.'
              });
            }
          });
        }
      }
    } else if (req.body.problemsJson) {
      // Safe JSON parsing with try/catch
      let raw;
      try {
        raw = typeof req.body.problemsJson === 'string' ? JSON.parse(req.body.problemsJson) : req.body.problemsJson;
      } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON provided in problemsJson.' });
      }

      if (Array.isArray(raw)) {
        parsedProblems = raw.map((p, idx) => ({
          id: `imp_${Date.now()}_${idx}`,
          title: String(p.title || `Problem ${idx + 1}`).slice(0, 100),
          difficulty: ['Easy', 'Medium', 'Hard'].includes(p.difficulty) ? p.difficulty : 'Medium',
          topic: String(p.topic || 'DSA Practice').slice(0, 50),
          sourceSheet: String(p.sourceSheet || req.body.sourceSheet || 'Custom Upload').slice(0, 50),
          url: String(p.url || 'https://leetcode.com').slice(0, 200),
          description: String(p.description || 'Imported practice challenge.').slice(0, 500)
        }));
      }
    } else {
      return res.status(400).json({ error: 'Please provide a file (.xlsx, .csv) or valid problemsJson' });
    }

    if (parsedProblems.length === 0) {
      return res.status(400).json({ error: 'No valid problems found in uploaded data' });
    }

    const saved = await Repository.addDsaProblems(parsedProblems);
    res.json({
      success: true,
      count: parsedProblems.length,
      imported: parsedProblems,
      totalCatalogSize: saved.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
