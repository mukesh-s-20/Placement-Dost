const BASE_URL = '/api';

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(email) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async loginWithGoogle(data) {
    const res = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getProfile(userId) {
    const res = await fetch(`${BASE_URL}/auth/me/${userId}`);
    return res.json();
  },

  async getDemoUsers() {
    const res = await fetch(`${BASE_URL}/auth/demo-users`);
    return res.json();
  },

  // Onboarding
  async getOnboardingVideo(interestArea) {
    const res = await fetch(`${BASE_URL}/onboarding/video?interestArea=${encodeURIComponent(interestArea || '')}`);
    return res.json();
  },

  async getReferenceConcepts(topic) {
    const res = await fetch(`${BASE_URL}/onboarding/reference-concepts?topic=${encodeURIComponent(topic || '')}`);
    return res.json();
  },

  async gradeRecallWriteUp(data) {
    const res = await fetch(`${BASE_URL}/onboarding/grade-writeup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Roadmap & Modules
  async getRoadmap(userId, track, topic) {
    let url = `${BASE_URL}/roadmap/${userId}?track=${track || 'dsa'}`;
    if (topic) url += `&topic=${encodeURIComponent(topic)}`;
    const res = await fetch(url);
    return res.json();
  },

  async completeModule(userId, track, stageId, moduleId) {
    const res = await fetch(`${BASE_URL}/roadmap/module-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, track, stageId, moduleId })
    });
    return res.json();
  },

  async recompleteModule(userId, moduleId) {
    const res = await fetch(`${BASE_URL}/roadmap/module-recomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, moduleId })
    });
    return res.json();
  },

  // Learning Space: Interpretation & Assignments
  async checkInterpretation(visualId, studentInterpretation) {
    const res = await fetch(`${BASE_URL}/learning/interpretation-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visualId, studentInterpretation })
    });
    return res.json();
  },

  async submitAssignment(data) {
    const res = await fetch(`${BASE_URL}/learning/assignment-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getRemediation(userId, topic) {
    const res = await fetch(`${BASE_URL}/learning/remediation/${userId}/${encodeURIComponent(topic)}`);
    return res.json();
  },

  // DSA Practice
  async getDsaProblems(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${BASE_URL}/dsa/problems?${params.toString()}`);
    return res.json();
  },

  async getDsaStatus(userId) {
    const res = await fetch(`${BASE_URL}/dsa/user-status/${userId}`);
    return res.json();
  },

  async solveDsaProblem(data) {
    const res = await fetch(`${BASE_URL}/dsa/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async importDsaProblems(formDataOrJson) {
    if (formDataOrJson instanceof FormData) {
      const res = await fetch(`${BASE_URL}/dsa/import`, {
        method: 'POST',
        body: formDataOrJson
      });
      return res.json();
    } else {
      const res = await fetch(`${BASE_URL}/dsa/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataOrJson)
      });
      return res.json();
    }
  },

  // Peer Mentorship
  async getPeerMentors(topic, excludeUserId) {
    let url = `${BASE_URL}/peer/mentors?topic=${encodeURIComponent(topic || '')}`;
    if (excludeUserId) url += `&excludeUserId=${excludeUserId}`;
    const res = await fetch(url);
    return res.json();
  },

  async requestPeerSession(data) {
    const res = await fetch(`${BASE_URL}/peer/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async startPeerSession(sessionId) {
    const res = await fetch(`${BASE_URL}/peer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    return res.json();
  },

  async completePeerSession(sessionId, remediationScoreAfter) {
    const res = await fetch(`${BASE_URL}/peer/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, remediationScoreAfter })
    });
    return res.json();
  },

  async getPeerSessions(userId) {
    const res = await fetch(`${BASE_URL}/peer/sessions/${userId}`);
    return res.json();
  },

  // Leaderboards
  async getLeaderboards(college, userId) {
    let url = `${BASE_URL}/leaderboard`;
    const params = new URLSearchParams();
    if (college) params.append('college', college);
    if (userId) params.append('userId', userId);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url);
    return res.json();
  },

  // Focus Mode
  async getFocusStatus(userId) {
    const res = await fetch(`${BASE_URL}/focus/status/${userId}`);
    return res.json();
  },

  async logFocusExit(userId, reason, moduleId) {
    const res = await fetch(`${BASE_URL}/focus/log-exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, reason, moduleId })
    });
    return res.json();
  },

  async resetFocusDaily(userId) {
    const res = await fetch(`${BASE_URL}/focus/reset-daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // Ledger & Config
  async getPointsLedger(userId) {
    const res = await fetch(`${BASE_URL}/points/ledger/${userId || ''}`);
    return res.json();
  },

  async getPointsConfig() {
    const res = await fetch(`${BASE_URL}/config/points`);
    return res.json();
  },

  async getRubricConfig() {
    const res = await fetch(`${BASE_URL}/config/rubric`);
    return res.json();
  }
};
