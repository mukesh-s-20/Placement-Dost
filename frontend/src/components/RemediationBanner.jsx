import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LifeBuoy,
  Users2,
  BookOpen,
  CheckCircle2,
  Coins
} from 'lucide-react';

export const RemediationBanner = ({ topic, onRequestPeerHelp }) => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [showAlternateFormat, setShowAlternateFormat] = useState(false);
  const [requestedMentorId, setRequestedMentorId] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (topic) {
      api.getPeerMentors(topic, user?.id).then(res => {
        setMentors(res.mentors || []);
      }).catch(err => console.warn(err));
    }
  }, [topic, user?.id]);

  const handleRequestPeer = async (mentor) => {
    try {
      setRequestedMentorId(mentor.id);
      await api.requestPeerSession({
        helpeeId: user?.id,
        helperId: mentor.id,
        topic: topic || 'Data Structures',
        notes: `Needs guidance on core concept and interview questions for ${topic}.`
      });
      setRequestSent(true);
      if (onRequestPeerHelp) onRequestPeerHelp(mentor);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="remediation-container">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Remediation Route Active
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Diagnostic Match
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              Reinforcement for: <span className="text-blue-900">{topic || 'Core Concept'}</span>
            </h4>
          </div>
        </div>

        <button
          onClick={() => setShowAlternateFormat(!showAlternateFormat)}
          className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{showAlternateFormat ? 'Hide Cheat-Sheet' : 'View Alternate Visual Cheat-Sheet'}</span>
        </button>
      </div>

      {/* Alternate Explanation Format */}
      {showAlternateFormat && (
        <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 space-y-2">
          <h5 className="text-xs font-bold text-slate-900">
            Alternate Pedagogical Format: Conceptual Decomposition
          </h5>
          <p className="text-slate-600">
            When standard definitions feel abstract, remember the 3-step anchor rule:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li><strong>Invariant:</strong> What condition must never be violated across operations?</li>
            <li><strong>Trigger:</strong> Exactly when does the state transition occur (e.g. balance factor {'>'} 1)?</li>
            <li><strong>Trade-off:</strong> What computation or space cost are we trading for speed?</li>
          </ul>
        </div>
      )}

      {/* Peer-to-Peer Learning Match */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-semibold text-slate-800">
              Matched Peer Mentors (Demonstrated Strength in Topic)
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            <span>Helpers earn +15 pts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {mentors.length > 0 ? (
            mentors.map(mentor => (
              <div
                key={mentor.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={mentor.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${mentor.name}`}
                    alt={mentor.name}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{mentor.name}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[110px]">{mentor.college}</p>
                    <span className="text-[10px] font-bold text-slate-800">
                      {mentor.proficiencyScore}% Topic Score
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestPeer(mentor)}
                  disabled={requestedMentorId === mentor.id}
                  className={`text-xs font-semibold py-1 px-2.5 rounded transition-all ${
                    requestedMentorId === mentor.id
                      ? 'bg-slate-200 text-slate-700'
                      : 'btn-primary'
                  }`}
                >
                  {requestedMentorId === mentor.id ? 'Requested' : 'Connect'}
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 col-span-3">
              Scanning for active peer mentors...
            </p>
          )}
        </div>

        {requestSent && (
          <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
            <span>Peer session request transmitted! Navigate to Peer Mentors in top nav to launch room.</span>
          </div>
        )}
      </div>
    </div>
  );
};
