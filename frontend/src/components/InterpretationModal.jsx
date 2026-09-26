import React, { useState } from 'react';
import { api } from '../services/api.js';
import { Eye, X, ArrowRight } from 'lucide-react';

export const InterpretationModal = ({ isOpen, onClose, visualId = 'tree_rotation' }) => {
  const [selectedVisual, setSelectedVisual] = useState(visualId);
  const [studentText, setStudentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const visuals = {
    tree_rotation: {
      id: 'tree_rotation',
      title: 'Visual Challenge A',
      renderSvg: () => (
        <svg viewBox="0 0 500 240" className="w-full h-48 bg-white rounded border border-slate-200 p-3">
          <text x="20" y="30" fill="#475569" fontSize="12" fontWeight="600">State 1: Skewed Tree (Height Factor = 2)</text>
          {/* Unbalanced Tree */}
          <circle cx="100" cy="80" r="18" fill="#eff6ff" stroke="#1e40af" strokeWidth="2" />
          <text x="100" y="85" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold">30</text>
          
          <line x1="88" y1="92" x2="62" y2="128" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="50" cy="140" r="18" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <text x="50" y="145" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="bold">20</text>
          
          <line x1="38" y1="152" x2="22" y2="188" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="15" cy="200" r="15" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <text x="15" y="205" textAnchor="middle" fill="#64748b" fontSize="10">10</text>

          {/* Transformation Arrow */}
          <path d="M 180 130 Q 230 100 280 130" fill="none" stroke="#1e40af" strokeWidth="2" strokeDasharray="4,4" />
          <polygon points="280,126 290,130 280,134" fill="#1e40af" />
          <text x="235" y="95" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold">Operation ?</text>

          {/* Balanced Tree */}
          <text x="320" y="30" fill="#16a34a" fontSize="12" fontWeight="600">State 2: Balanced Tree (Height Factor = 0)</text>
          <circle cx="390" cy="90" r="18" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
          <text x="390" y="95" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">20</text>

          <line x1="375" y1="102" x2="340" y2="140" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="330" cy="150" r="16" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <text x="330" y="155" textAnchor="middle" fill="#0f172a" fontSize="11">10</text>

          <line x1="405" y1="102" x2="440" y2="140" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="450" cy="150" r="16" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <text x="450" y="155" textAnchor="middle" fill="#0f172a" fontSize="11">30</text>
        </svg>
      )
    },
    overfitting_curve: {
      id: 'overfitting_curve',
      title: 'Visual Challenge B',
      renderSvg: () => (
        <svg viewBox="0 0 500 240" className="w-full h-48 bg-white rounded border border-slate-200 p-3">
          <text x="20" y="25" fill="#475569" fontSize="11" fontWeight="600">Loss vs Epochs Analysis</text>
          {/* Axes */}
          <line x1="50" y1="30" x2="50" y2="200" stroke="#94a3b8" strokeWidth="2" />
          <line x1="50" y1="200" x2="470" y2="200" stroke="#94a3b8" strokeWidth="2" />
          <text x="20" y="110" fill="#64748b" fontSize="10" transform="rotate(-90 20 110)">Loss</text>
          <text x="250" y="225" fill="#64748b" fontSize="10">Training Iterations (Epochs) ➔</text>

          {/* Curve 1 (Training) */}
          <path d="M 55 50 Q 150 180 450 190" fill="none" stroke="#1e40af" strokeWidth="2.5" />
          <text x="400" y="180" fill="#1e40af" fontSize="11" fontWeight="600">Curve A</text>

          {/* Curve 2 (Validation) */}
          <path d="M 55 70 Q 200 160 250 150 T 450 60" fill="none" stroke="#0f172a" strokeWidth="2.5" />
          <text x="400" y="50" fill="#0f172a" fontSize="11" fontWeight="600">Curve B</text>

          {/* Critical Point */}
          <line x1="250" y1="30" x2="250" y2="200" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
          <circle cx="250" cy="150" r="4" fill="#0f172a" />
          <text x="255" y="135" fill="#0f172a" fontSize="10" fontWeight="600">Inflection Point</text>
        </svg>
      )
    },
    tcp_handshake: {
      id: 'tcp_handshake',
      title: 'Visual Challenge C',
      renderSvg: () => (
        <svg viewBox="0 0 500 240" className="w-full h-48 bg-white rounded border border-slate-200 p-3">
          <text x="20" y="25" fill="#475569" fontSize="11" fontWeight="600">Network Communication Sequence</text>
          <rect x="70" y="40" width="80" height="28" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
          <text x="110" y="58" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="600">Host A</text>
          <line x1="110" y1="70" x2="110" y2="210" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" />

          <rect x="350" y="40" width="80" height="28" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
          <text x="390" y="58" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="600">Host B</text>
          <line x1="390" y1="70" x2="390" y2="210" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" />

          {/* Packet 1 */}
          <line x1="110" y1="100" x2="390" y2="130" stroke="#1e40af" strokeWidth="2" />
          <text x="250" y="110" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="600">Packet 1: [???]</text>

          {/* Packet 2 */}
          <line x1="390" y1="140" x2="110" y2="170" stroke="#0f172a" strokeWidth="2" />
          <text x="250" y="150" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="600">Packet 2: [???]</text>

          {/* Packet 3 */}
          <line x1="110" y1="180" x2="390" y2="210" stroke="#1e40af" strokeWidth="2" />
          <text x="250" y="190" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="600">Packet 3: [???]</text>
        </svg>
      )
    }
  };

  const currentVisual = visuals[selectedVisual] || visuals.tree_rotation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentText.trim()) return;

    setLoading(true);
    try {
      const res = await api.checkInterpretation(selectedVisual, studentText);
      setResult(res.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentText('');
    setResult(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="interpretation-modal-content">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Interpretation Check</h3>
              <p className="text-xs text-slate-500">Ungraded formative conceptual check</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Selector Tabs */}
        <div className="flex gap-2 mb-4">
          {Object.keys(visuals).map(k => (
            <button
              key={k}
              onClick={() => {
                setSelectedVisual(k);
                handleReset();
              }}
              className={`px-3 py-1 text-xs rounded font-medium border transition-all ${
                selectedVisual === k
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {visuals[k].title}
            </button>
          ))}
        </div>

        {/* The Concept Visual Diagram */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 px-1">
            <span className="font-semibold">Observe the diagram below (no text explanation):</span>
            <span className="text-slate-500">Intuition Probe</span>
          </div>
          {currentVisual.renderSvg()}
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Explain what you interpret from this visual in your own words:
              </label>
              <textarea
                value={studentText}
                onChange={(e) => setStudentText(e.target.value)}
                rows={3}
                placeholder="What algorithmic behavior, state transition, or complexity invariant is shown?"
                className="input-textarea text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Formative probe • Does not impact formal score marks
              </span>
              <button
                type="submit"
                disabled={loading || !studentText.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? 'Evaluating...' : 'Check Interpretation'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 bg-slate-50 rounded p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Concept</span>
                <h4 className="text-sm font-bold text-slate-900">{result.conceptName}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Intuition Alignment</span>
                <div className="text-lg font-bold text-slate-900">
                  {result.accuracyPercent}%
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">Feedback:</p>
              <p>{result.instantFeedback}</p>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700">
              <p className="font-semibold text-slate-900 mb-0.5">Expected Mechanism:</p>
              <p>{result.expectedCore}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={handleReset} className="btn-secondary text-xs">
                Try Another Write-up
              </button>
              <button onClick={onClose} className="btn-primary text-xs">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
