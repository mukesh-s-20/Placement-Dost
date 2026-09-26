import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { FileEdit, CheckCircle2, ShieldCheck, X, AlertCircle } from 'lucide-react';

export const AssignmentModal = ({ isOpen, onClose, module, topic, onStruggleDetected }) => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);

  if (!isOpen) return null;

  const defaultPrompt = `Synthesize the primary mechanism of ${module?.title || topic}. Specifically explain: 
1) The underlying data structures or state invariants.
2) Best-case and worst-case time/space complexity.
3) A practical edge case that campus placement interviewers frequently test.`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submission.trim()) return;

    setLoading(true);
    try {
      const res = await api.submitAssignment({
        userId: user?.id,
        moduleId: module?.moduleId || 'mod_curr',
        topic: topic || module?.title || 'Data Structures',
        prompt: defaultPrompt,
        studentSubmission: submission
      });

      setResultData(res);
      setSubmitted(true);

      // If hidden marks triggered struggle (<60), alert parent for remediation
      if (res.struggleDetected && onStruggleDetected) {
        onStruggleDetected(topic || module?.title);
      }
    } catch (err) {
      console.error('Assignment submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmission('');
    setSubmitted(false);
    setResultData(null);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="assignment-modal-content">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Technical Assignment</h3>
              <p className="text-xs text-slate-500">Fixed 4-Dimension Rubric Evaluator (§4 Step 5)</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">Assignment Prompt:</p>
              <p className="whitespace-pre-line leading-relaxed">{defaultPrompt}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Technical Synthesis:
              </label>
              <textarea
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                rows={6}
                placeholder="Write your explanation demonstrating core concept accuracy, accurate key terms, depth with examples, and logical clarity..."
                className="input-textarea text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>Fixed 4-dimension benchmark active</span>
              </div>
              <button
                type="submit"
                disabled={loading || !submission.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? 'Evaluating Submission...' : 'Submit Assignment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-800">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h4 className="text-lg font-bold text-slate-900">Assignment Recorded Successfully</h4>

            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your response has been parsed, matched against expected concept benchmarks, and recorded to your continuous placement readiness profile.
            </p>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left">
              <p className="font-semibold text-slate-900 mb-0.5">Continuous Assessment Note:</p>
              <p>
                Per platform design, raw numerical marks remain hidden to keep you focused on conceptual mastery rather than score anxiety.
              </p>
            </div>

            {resultData?.struggleDetected && (
              <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 max-w-md mx-auto text-left flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-semibold mb-0.5">Remediation Suggested</strong>
                  <span>
                    Our diagnostic engine flagged key technical gaps. An alternate visual breakdown and matched peer mentors are now available for this topic.
                  </span>
                </div>
              </div>
            )}

            <button onClick={handleClose} className="btn-primary px-6 mt-2">
              Continue Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
