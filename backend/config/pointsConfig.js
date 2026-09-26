export const POINTS_CONFIG = {
  DAILY_LOGIN: 1,
  SOLVE_DSA_EASY: 3,
  SOLVE_DSA_MEDIUM: 8,
  SOLVE_DSA_HARD: 10,
  MAINTAIN_DAILY_STREAK: 1,
  COMPLETE_OVERDUE_PROBLEM: 1,
  COMPLETE_SUBMODULE: 1,
  RECOMPLETE_MODULE: 1,
  PEER_SESSION_HELPER: 15,
  PEER_SESSION_BONUS_IMPROVEMENT: 5,
  FREE_EXITS_ALLOWED: 3,
  EXIT_BASE_COST: 5,
  EXIT_STEP_COST: 5 // 4th exit costs 5, 5th costs 10, 6th costs 15
};

export const TRACKS = [
  { id: 'aptitude', name: 'Aptitude & Reasoning', icon: 'Brain' },
  { id: 'dsa', name: 'Data Structures & Algorithms', icon: 'Code2' },
  { id: 'cs_fundamentals', name: 'CS Fundamentals', icon: 'Cpu' },
  { id: 'projects', name: 'Projects', icon: 'FolderGit2' }
];
