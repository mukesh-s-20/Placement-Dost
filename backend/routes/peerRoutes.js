import express from 'express';
import { Repository } from '../models/repository.js';
import { POINTS_CONFIG } from '../config/pointsConfig.js';

const router = express.Router();

// Find peer mentors with demonstrated strength in a topic
router.get('/mentors', async (req, res) => {
  try {
    const { topic, excludeUserId } = req.query;
    const users = await Repository.getUsers();

    const mentors = users.filter(u => {
      if (u.id === excludeUserId) return false;
      const topicScore = u.topicProficiencies?.[topic];
      return topicScore >= 80 || u.comprehensionBaseline >= 85 || u.role === 'peer_mentor';
    }).map(u => ({
      id: u.id,
      name: u.name,
      college: u.college,
      department: u.department,
      proficiencyScore: u.topicProficiencies?.[topic] || u.comprehensionBaseline || 90,
      avatar: u.avatar,
      points: u.points
    }));

    res.json({ mentors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request a peer tutoring session
router.post('/request', async (req, res) => {
  try {
    const { helpeeId, helperId, topic, notes } = req.body;
    if (!helpeeId || !helperId || !topic) {
      return res.status(400).json({ error: 'helpeeId, helperId, and topic are required' });
    }

    const helpee = await Repository.getUserById(helpeeId);
    const helper = await Repository.getUserById(helperId);

    if (!helpee || !helper) {
      return res.status(404).json({ error: 'Student or helper not found' });
    }

    const session = await Repository.createPeerSession({
      helpeeId,
      helpeeName: helpee.name,
      helperId,
      helperName: helper.name,
      topic,
      remediationScoreBefore: helpee.topicProficiencies?.[topic] || helpee.comprehensionBaseline || 50,
      notes: notes || 'Needs guidance on core principles and placement interview questions.'
    });

    res.status(201).json({ session, message: 'Peer session requested successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept and start a peer session
router.post('/start', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const updated = await Repository.updatePeerSession(sessionId, {
      status: 'active',
      startedAt: new Date().toISOString()
    });
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    res.json({ session: updated, message: 'Peer learning session is now active' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete peer session & award helper points (+15 pts flat base)
router.post('/complete', async (req, res) => {
  try {
    const { sessionId, remediationScoreAfter } = req.body;
    const sessions = await Repository.getPeerSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Peer session not found' });
    }

    let helperReward = POINTS_CONFIG.PEER_SESSION_HELPER; // +15 points
    let bonusEarned = false;

    // Open question 1 implementation:
    // Bonus +5 points if helpee's post-session remediation score is >= 70 or improved by >= 20 pts!
    if (remediationScoreAfter && (remediationScoreAfter >= 70 || (remediationScoreAfter - (session.remediationScoreBefore || 45) >= 20))) {
      helperReward += POINTS_CONFIG.PEER_SESSION_BONUS_IMPROVEMENT; // +5 bonus
      bonusEarned = true;
    }

    // Award helper points
    await Repository.addPoints(
      session.helperId,
      helperReward,
      'PEER_TUTOR_SESSION_COMPLETE',
      `Mentored ${session.helpeeName} on ${session.topic} (+${helperReward} pts${bonusEarned ? ' including performance improvement bonus' : ''})`
    );

    const updated = await Repository.updatePeerSession(sessionId, {
      status: 'completed',
      helperPointsAwarded: helperReward,
      remediationScoreAfter: remediationScoreAfter || 85,
      completedAt: new Date().toISOString()
    });

    // Also update helpee's topic proficiency
    await Repository.updateUser(session.helpeeId, {
      [`topicProficiencies.${session.topic}`]: remediationScoreAfter || 85
    });

    res.json({
      success: true,
      session: updated,
      pointsAwardedToHelper: helperReward,
      bonusEarned,
      message: `Session completed! Helper ${session.helperName} earned +${helperReward} points.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's peer sessions
router.get('/sessions/:userId', async (req, res) => {
  try {
    const sessions = await Repository.getPeerSessions(req.params.userId);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
