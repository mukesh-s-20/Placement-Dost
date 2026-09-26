import express from 'express';
import { AIService } from '../services/aiService.js';
import { Repository } from '../models/repository.js';
import { POINTS_CONFIG } from '../config/pointsConfig.js';

const router = express.Router();

// Get or generate roadmap for user & track
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const track = req.query.track || 'dsa';
    const topic = req.query.topic;

    const user = await Repository.getUserById(userId);
    let roadmap = await Repository.getRoadmap(userId, track, topic);

    if (!roadmap) {
      const generated = AIService.generateRoadmap(track, topic, user || {});
      roadmap = await Repository.saveRoadmap({
        userId,
        track,
        topic: topic || generated.topic,
        title: generated.title,
        stages: generated.stages,
        progressPercent: 0
      });
    }

    res.json({ roadmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark sub-module completed (+1 point)
router.post('/module-complete', async (req, res) => {
  try {
    const { userId, track, stageId, moduleId } = req.body;
    if (!userId || !moduleId) {
      return res.status(400).json({ error: 'userId and moduleId are required' });
    }

    const roadmap = await Repository.getRoadmap(userId, track || 'dsa');
    if (roadmap) {
      let found = false;
      for (const stage of roadmap.stages) {
        const mod = stage.modules.find(m => m.moduleId === moduleId);
        if (mod) {
          mod.status = 'completed';
          found = true;
          break;
        }
      }
      if (found) {
        // Recalculate progress
        let total = 0;
        let completed = 0;
        roadmap.stages.forEach(s => s.modules.forEach(m => {
          total++;
          if (m.status === 'completed') completed++;
        }));
        roadmap.progressPercent = Math.round((completed / Math.max(1, total)) * 100);
        await Repository.saveRoadmap(roadmap);
      }
    }

    // Award +1 point for completing a sub-module
    const ledger = await Repository.addPoints(
      userId,
      POINTS_CONFIG.COMPLETE_SUBMODULE,
      'COMPLETE_SUBMODULE',
      `Completed sub-module: ${moduleId}`
    );

    res.json({
      success: true,
      pointsEarned: POINTS_CONFIG.COMPLETE_SUBMODULE,
      balanceAfter: ledger?.user?.points,
      roadmap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Re-complete a module (+1 point)
router.post('/module-recomplete', async (req, res) => {
  try {
    const { userId, moduleId } = req.body;
    const ledger = await Repository.addPoints(
      userId,
      POINTS_CONFIG.RECOMPLETE_MODULE,
      'RECOMPLETE_MODULE',
      `Re-completed module review: ${moduleId}`
    );
    res.json({
      success: true,
      pointsEarned: POINTS_CONFIG.RECOMPLETE_MODULE,
      balanceAfter: ledger?.user?.points
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
