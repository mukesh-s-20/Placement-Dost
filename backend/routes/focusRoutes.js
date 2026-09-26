import express from 'express';
import { Repository } from '../models/repository.js';
import { POINTS_CONFIG } from '../config/pointsConfig.js';

const router = express.Router();

// Get user focus exit status
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await Repository.getUserById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const freeRemaining = user.freeExitsRemaining !== undefined ? user.freeExitsRemaining : POINTS_CONFIG.FREE_EXITS_ALLOWED;
    const exitCountToday = user.exitCountToday || 0;

    // Calculate next exit cost if free exits are exhausted
    let nextExitCost = 0;
    if (freeRemaining <= 0) {
      const paidExitNumber = Math.max(0, exitCountToday - POINTS_CONFIG.FREE_EXITS_ALLOWED);
      nextExitCost = POINTS_CONFIG.EXIT_BASE_COST + (paidExitNumber * POINTS_CONFIG.EXIT_STEP_COST);
    }

    res.json({
      freeExitsRemaining: freeRemaining,
      exitCountToday,
      nextExitCost,
      userPoints: user.points || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log an exit attempt and deduct points if beyond 3 free step-outs
router.post('/log-exit', async (req, res) => {
  try {
    const { userId, reason, moduleId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await Repository.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let freeRemaining = user.freeExitsRemaining !== undefined ? user.freeExitsRemaining : POINTS_CONFIG.FREE_EXITS_ALLOWED;
    let exitCount = (user.exitCountToday || 0) + 1;
    let cost = 0;
    let freeUsed = false;

    if (freeRemaining > 0) {
      freeRemaining -= 1;
      freeUsed = true;
      await Repository.updateUser(userId, {
        freeExitsRemaining: freeRemaining,
        exitCountToday: exitCount
      });

      return res.json({
        success: true,
        freeUsed: true,
        costPaid: 0,
        freeExitsRemaining: freeRemaining,
        exitCountToday: exitCount,
        balanceAfter: user.points,
        message: `Step-out granted. You have ${freeRemaining} free exit(s) remaining for today.`
      });
    } else {
      // 4th+ exit incurs points fee: 5 points + 5 points for each subsequent exit
      const paidExitIndex = exitCount - POINTS_CONFIG.FREE_EXITS_ALLOWED - 1;
      cost = POINTS_CONFIG.EXIT_BASE_COST + (paidExitIndex * POINTS_CONFIG.EXIT_STEP_COST);

      const ledger = await Repository.addPoints(
        userId,
        -cost,
        'FOCUS_MODE_EARLY_EXIT_FEE',
        `Early exit fee (${exitCount}th exit today, left during ${moduleId || 'Learning Space'})`
      );

      await Repository.updateUser(userId, {
        exitCountToday: exitCount
      });

      return res.json({
        success: true,
        freeUsed: false,
        costPaid: cost,
        freeExitsRemaining: 0,
        exitCountToday: exitCount,
        balanceAfter: ledger?.user?.points,
        message: `Focus penalty: ${cost} points deducted for leaving session early.`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset daily focus exits
router.post('/reset-daily', async (req, res) => {
  try {
    const { userId } = req.body;
    await Repository.updateUser(userId, {
      freeExitsRemaining: POINTS_CONFIG.FREE_EXITS_ALLOWED,
      exitCountToday: 0
    });
    res.json({ success: true, message: 'Free exits reset to 3' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
