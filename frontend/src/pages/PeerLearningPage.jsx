import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Users2,
  Coins,
  CheckCircle2
} from 'lucide-react';

export const PeerLearningPage = () => {
  const { user } = useAuth();

  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [postScore, setPostScore] = useState(85);
  const [completing, setCompleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchPeerData = async () => {
    if (!user?.id) return;
    try {
      const [mentorRes, sessionRes] = await Promise.all([
        api.getPeerMentors('ml_basics', user.id),
        api.getPeerSessions(user.id)
      ]);
      setMentors(mentorRes.mentors || []);
      setSessions(sessionRes.sessions || []);

      const active = (sessionRes.sessions || []).find(s => s.status === 'active' || s.status === 'requested');
      if (active) setActiveSession(active);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPeerData();
  }, [user?.id]);

  const handleStartSession = async (session) => {
    try {
      const res = await api.startPeerSession(session.id);
      setActiveSession(res.session);
      fetchPeerData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    setCompleting(true);
    try {
      const res = await api.completePeerSession(activeSession.id, parseInt(postScore) || 85);
      if (res.success) {
        setFeedbackMsg(res.message);
        setActiveSession(null);
        fetchPeerData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const handleRequestNewSession = async (mentor) => {
    try {
      const res = await api.requestPeerSession({
        helpeeId: user?.id,
        helperId: mentor.id,
        topic: 'Binary Search Trees & Balancing',
        notes: `Peer session requested by ${user?.name} on Binary Search Trees.`
      });
      setActiveSession(res.session);
      fetchPeerData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="peer-page-container space-y-5">
      {/* Banner */}
      <div className="card-glass p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Users2 className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Collaborative Mentorship
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Peer-to-Peer Technical Learning Network
            </h3>
            <p className="text-xs text-slate-600">
              Students who excel in a topic mentor peers facing gaps. Mentors earn <strong>+15 points</strong> base reward plus <strong>+5 bonus points</strong> if the helpee demonstrates post-remediation score improvement.
            </p>
          </div>
        </div>

        <div className="stat-pill shrink-0">
          <div className="stat-pill-icon">
            <Coins className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <span className="stat-pill-label">Base Helper Reward</span>
            <span className="stat-pill-val">+15 pts</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* ACTIVE SESSION ROOM */}
      {activeSession && (
        <div className="card-glass p-5 border-l-4 border-l-blue-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Status: {activeSession.status.toUpperCase()}
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-1">
                Peer Session: {activeSession.topic}
              </h4>
              <p className="text-xs text-slate-600">
                Mentor: <strong className="text-slate-900">{activeSession.helperName}</strong> • Mentee: <strong className="text-slate-900">{activeSession.helpeeName}</strong>
              </p>
            </div>

            {activeSession.status === 'requested' && (
              <button
                onClick={() => handleStartSession(activeSession)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Accept & Start Room
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-900 block">Session Notes:</span>
              <p className="text-slate-600 leading-relaxed">{activeSession.notes}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-900 block">Improvement Verification:</span>
              <div className="flex items-center justify-between text-slate-600">
                <span>Diagnostic Baseline Before:</span>
                <strong className="text-slate-900">{activeSession.remediationScoreBefore || 45}%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Post-Session Remediation Score:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={postScore}
                  onChange={(e) => setPostScore(e.target.value)}
                  className="w-16 px-2 py-0.5 bg-white border border-slate-300 text-slate-900 rounded text-right font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                If post-remediation score {'>='} 70%, the mentor unlocks an additional <strong>+5 bonus points</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleCompleteSession}
              disabled={completing}
              className="btn-primary text-xs flex items-center gap-2 py-1.5 px-4 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completing ? 'Concluding Session...' : 'Conclude Session & Award Points'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Available Qualified Peer Mentors */}
      <div className="card-glass p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-0.5">
          Available Peer Mentors Across Colleges
        </h4>
        <p className="text-xs text-slate-500 mb-3">
          Students with demonstrated mastery ({'>'}80%) ready to provide 1-on-1 placement guidance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {mentors.map(m => (
            <div
              key={m.id}
              className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.name}`}
                  alt={m.name}
                  className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-900 leading-tight">{m.name}</h5>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{m.college}</p>
                  <span className="text-[10px] font-bold text-slate-700">{m.proficiencyScore}% Topic Score</span>
                </div>
              </div>

              <button
                onClick={() => handleRequestNewSession(m)}
                className="btn-secondary text-[11px] py-1 px-2.5"
              >
                Request
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Past Peer Sessions History */}
      {sessions.length > 0 && (
        <div className="card-glass p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Mentorship Session History</h4>
          <div className="space-y-1.5">
            {sessions.map(s => (
              <div
                key={s.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{s.topic}</p>
                  <p className="text-[10px] text-slate-500">
                    Mentor: {s.helperName} • Mentee: {s.helpeeName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    +{s.helperPointsAwarded || 15} pts
                  </span>
                  <span className="block text-[10px] text-slate-500">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
