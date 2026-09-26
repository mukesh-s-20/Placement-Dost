import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFocusMode } from '../context/FocusModeContext.jsx';
import {
  Trophy,
  Flame,
  Coins,
  ArrowRight,
  School,
  Globe,
  Calendar,
  Code2,
  Lock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { freeExitsRemaining } = useFocusMode();

  const [leaderboardTab, setLeaderboardTab] = useState('college'); // 'college' | 'weekly' | 'global'
  const [leaderboardData, setLeaderboardData] = useState({
    collegeLeaderboard: [],
    weeklyLeaderboard: [],
    globalLeaderboard: [],
    colleges: [],
    userStats: null
  });
  const [selectedCollege, setSelectedCollege] = useState(user?.college || 'Chennai Institute of Technology');

  useEffect(() => {
    api.getLeaderboards(selectedCollege, user?.id)
      .then(res => {
        setLeaderboardData(res);
        if (res.selectedCollege) setSelectedCollege(res.selectedCollege);
      })
      .catch(err => console.error(err));
  }, [selectedCollege, user?.id]);

  const currentLeaderboard =
    leaderboardTab === 'college'
      ? leaderboardData.collegeLeaderboard
      : leaderboardTab === 'weekly'
      ? leaderboardData.weeklyLeaderboard
      : leaderboardData.globalLeaderboard;

  return (
    <div className="dashboard-container space-y-5">
      {/* Welcome & Highlights Bar */}
      <div className="dashboard-welcome-banner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Placement Prep Dashboard
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Welcome, {user?.name?.split(' ')[0] || 'Student'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {user?.college || 'Chennai Institute of Technology'} • {user?.department || 'CSE'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Points Stat */}
            <div className="stat-pill">
              <div className="stat-pill-icon">
                <Coins className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <span className="stat-pill-label">Total Points</span>
                <span className="stat-pill-val">{user?.points ?? 10} pts</span>
              </div>
            </div>

            {/* Streak Stat */}
            <div className="stat-pill">
              <div className="stat-pill-icon">
                <Flame className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <span className="stat-pill-label">Daily Streak</span>
                <span className="stat-pill-val">{user?.streakDaily || 1} Days</span>
              </div>
            </div>

            {/* Comprehension Baseline Stat */}
            <div className="stat-pill">
              <div className="stat-pill-icon">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <span className="stat-pill-label">Comprehension</span>
                <span className="stat-pill-val">{user?.comprehensionBaseline || 75}%</span>
              </div>
            </div>

            {/* Free Exits Stat */}
            <div className="stat-pill">
              <div className="stat-pill-icon">
                <Lock className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <span className="stat-pill-label">Free Exits</span>
                <span className="stat-pill-val">{freeExitsRemaining}/3 left</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. LEADERBOARDS SECTION (College, Weekly, Global) */}
      <div className="card-glass p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Campus & Global Leaderboards</h3>
              <p className="text-xs text-slate-500">Gamified consistency rankings</p>
            </div>
          </div>

          {/* Leaderboard Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setLeaderboardTab('college')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-all ${
                leaderboardTab === 'college'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>College Board</span>
            </button>

            <button
              onClick={() => setLeaderboardTab('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-all ${
                leaderboardTab === 'weekly'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Sprint</span>
            </button>

            <button
              onClick={() => setLeaderboardTab('global')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-all ${
                leaderboardTab === 'global'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Standings</span>
            </button>
          </div>
        </div>

        {/* Filter by College if College tab selected */}
        {leaderboardTab === 'college' && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-slate-500 font-medium">Campus Filter:</span>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-900"
            >
              {leaderboardData.colleges?.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">College</th>
                <th className="py-2.5 px-3">Streak</th>
                <th className="py-2.5 px-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentLeaderboard.map((item, idx) => {
                const isCurrentUser = item.id === user?.id;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isCurrentUser ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      #{item.rank || idx + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.name}`}
                          alt={item.name}
                          className="w-6 h-6 rounded-full border border-slate-200 bg-white"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {item.name} {isCurrentUser && <span className="text-blue-900 text-[10px] font-bold">(You)</span>}
                          </p>
                          {item.department && <p className="text-[10px] text-slate-500">{item.department}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      {item.college}
                    </td>

                    <td className="py-2.5 px-3 text-slate-700">
                      {item.streakDaily || 1}d
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {item.weeklyPoints !== undefined ? item.weeklyPoints : item.points} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. CONTINUE LEARNING CARD (§3 STEP 2) & QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Continue Learning Main Card */}
        <div className="md:col-span-2 card-glass p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Continue Learning (§3 Step 2)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Focus Mode Guarded
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Data Structures & Algorithms: Trees & Graph Traversals
            </h3>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Resume your personalized stage blueprint. Watch embedded linear lectures, flip active recall flashcards, and submit module assignments.
            </p>

            <div className="mt-3 p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <span>Next: <strong>Binary Search Tree Balancing & Rotations</strong></span>
              <span className="text-slate-500">Stage 1 of 3</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Entering Learning Space engages Focus Mode.
            </span>
            <button
              onClick={() => onNavigate('learn')}
              className="btn-primary flex items-center gap-2 font-semibold"
            >
              <span>Enter Learning Space</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Daily DSA Problem Card */}
        <div className="card-glass p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Code2 className="w-4 h-4 text-slate-700" />
                <span>Daily Problem</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Streak +1
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 mt-1">
              Lowest Common Ancestor in BST
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Medium (+8 pts)
              </span>
              <span className="text-[10px] text-slate-500">Striver SDE Sheet</span>
            </div>

            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              Given a binary search tree, find the lowest common ancestor node of two given nodes p and q in O(h) time.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={() => onNavigate('dsa')}
              className="w-full btn-secondary text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>Solve Today's Challenge</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
