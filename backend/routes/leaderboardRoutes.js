import express from 'express';
import { Repository } from '../models/repository.js';

const router = express.Router();

// Get multi-dimensional leaderboards (College, Weekly, Global)
router.get('/', async (req, res) => {
  try {
    const { college, userId } = req.query;
    const users = await Repository.getUsers();

    // Global: Sorted by points descending
    const globalSorted = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    const globalLeaderboard = globalSorted.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      college: u.college,
      points: u.points || 0,
      streakDaily: u.streakDaily || 0,
      streakWeekly: u.streakWeekly || 0,
      avatar: u.avatar
    }));

    // College leaderboard (filtered by specific college if provided, or group by college)
    const targetCollege = college || 'Chennai Institute of Technology';
    const collegeFiltered = users.filter(u => u.college?.toLowerCase() === targetCollege.toLowerCase());
    const collegeSorted = collegeFiltered.sort((a, b) => (b.points || 0) - (a.points || 0));
    const collegeLeaderboard = collegeSorted.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      department: u.department,
      college: u.college,
      points: u.points || 0,
      streakDaily: u.streakDaily || 0,
      avatar: u.avatar
    }));

    // Weekly leaderboard (calculated by weekly streak and recent sprint points)
    const weeklySorted = [...users].sort((a, b) => {
      const scoreB = (b.points || 0) * 0.4 + (b.streakWeekly || 0) * 20 + (b.streakDaily || 0) * 5;
      const scoreA = (a.points || 0) * 0.4 + (a.streakWeekly || 0) * 20 + (a.streakDaily || 0) * 5;
      return scoreB - scoreA;
    });
    const weeklyLeaderboard = weeklySorted.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      college: u.college,
      weeklyPoints: Math.round((u.points || 0) * 0.35 + (u.streakDaily || 0) * 8),
      streakDaily: u.streakDaily || 0,
      avatar: u.avatar
    }));

    // User's own ranks
    let userStats = null;
    if (userId) {
      const gRank = globalLeaderboard.findIndex(u => u.id === userId) + 1;
      const cRank = collegeLeaderboard.findIndex(u => u.id === userId) + 1;
      const wRank = weeklyLeaderboard.findIndex(u => u.id === userId) + 1;
      const currentUser = users.find(u => u.id === userId);
      userStats = {
        globalRank: gRank || '-',
        collegeRank: cRank || '-',
        weeklyRank: wRank || '-',
        collegeName: currentUser?.college || targetCollege,
        points: currentUser?.points || 0,
        streakDaily: currentUser?.streakDaily || 1,
        streakWeekly: currentUser?.streakWeekly || 1,
        freeExitsRemaining: currentUser?.freeExitsRemaining !== undefined ? currentUser.freeExitsRemaining : 3
      };
    }

    // List of available colleges
    const collegeList = Array.from(new Set(users.map(u => u.college).filter(Boolean)));

    res.json({
      globalLeaderboard,
      collegeLeaderboard,
      weeklyLeaderboard,
      selectedCollege: targetCollege,
      colleges: collegeList,
      userStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
