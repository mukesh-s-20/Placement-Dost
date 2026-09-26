import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  CalendarCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const PrepPlanPage = ({ onNavigateToLearn }) => {
  const { user } = useAuth();
  const [targetDays] = useState(35);

  const baseline = user?.comprehensionBaseline || 78;
  const readinessIndex = Math.min(95, Math.round(baseline * 0.5 + (user?.points || 10) * 0.15 + 15));

  const weeklySchedule = [
    {
      week: 'Week 1',
      title: 'Quantitative Foundations & Speed Aptitude',
      status: 'completed',
      focus: 'Percentages, Profit/Loss shortcuts, Combinatorics, and Conditional Probability.',
      milestone: 'Solve 20 Aptitude Placement drills with <90s per question.'
    },
    {
      week: 'Week 2',
      title: 'Trees, Invariants & Graph Traversals',
      status: 'in_progress',
      focus: 'BST rotations, AVL height balancing, BFS shortest path, DFS cycle detection.',
      milestone: 'Master LCA in BST, Binary Tree Zigzag, and Rotten Oranges.'
    },
    {
      week: 'Week 3',
      title: 'Dynamic Programming & High-Yield Mediums',
      status: 'upcoming',
      focus: '0/1 Knapsack, Longest Common Subsequence, Kadane’s algorithm, and memoization grids.',
      milestone: 'Solve 15 Tier-1 product company DP patterns.'
    },
    {
      week: 'Week 4',
      title: 'Core CS Foundations (OS, DBMS & Networks)',
      status: 'upcoming',
      focus: 'Process vs thread memory spaces, Coffman deadlock conditions, B+ Tree index scans, and TCP handshake.',
      milestone: 'Pass CS Fundamentals mock diagnostic benchmark.'
    },
    {
      week: 'Week 5',
      title: 'System Design & Project Defense',
      status: 'upcoming',
      focus: 'Caching strategies, database sharding, CAP theorem, and deep-dive into resume projects.',
      milestone: 'Complete Guided Project Track milestone verification.'
    },
    {
      week: 'Week 6',
      title: 'Mock Placement Drives & Peer Teaching',
      status: 'upcoming',
      focus: '1-on-1 peer teaching sessions, resume review, and interview drills.',
      milestone: 'Accumulate +50 peer tutoring points.'
    }
  ];

  return (
    <div className="prep-plan-container space-y-5">
      {/* Target Drive Countdown Banner */}
      <div className="card-glass p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Near-Placement Plan
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Placement Readiness Index: {readinessIndex}%
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
            Tailored sprint for <strong>{user?.name || 'Student'}</strong> aiming for <strong>{user?.topCareerChoice || 'Tier-1 SDE'}</strong> at <strong>{user?.college || 'CIT'}</strong>.
          </p>
        </div>

        {/* Countdown Pill */}
        <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded border border-slate-200 shrink-0">
          <Clock className="w-5 h-5 text-slate-700" />
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Campus Drives Countdown</span>
            <div className="text-base font-bold text-slate-900">{targetDays} Days Remaining</div>
          </div>
        </div>
      </div>

      {/* Diagnostic Alert */}
      <div className="card-glass p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-l-4 border-l-slate-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-slate-700 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Placement Diagnostic Check: Dynamic Programming & Concurrency</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Based on your comprehension baseline ({baseline}/100), we recommend allocating extra review to memory invariants.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToLearn}
          className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
        >
          Review Weak Topic
        </button>
      </div>

      {/* Week-by-Week Sprint Schedule */}
      <div className="card-glass p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">6-Week Campus Placement Sprint Roadmap</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Week 2 Active</span>
        </div>

        <div className="space-y-2">
          {weeklySchedule.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded border text-xs transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                item.status === 'in_progress'
                  ? 'bg-blue-50/50 border-blue-900/30'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-800" />
                  ) : item.status === 'in_progress' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      {item.week}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    {item.status === 'in_progress' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        Current Focus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.focus}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 italic">
                    Milestone: {item.milestone}
                  </p>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                {item.status === 'in_progress' ? (
                  <button
                    onClick={onNavigateToLearn}
                    className="btn-primary text-xs py-1 px-3 flex items-center gap-1 font-semibold"
                  >
                    <span>View Modules</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : item.status === 'completed' ? (
                  <span className="text-slate-800 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Upcoming</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
