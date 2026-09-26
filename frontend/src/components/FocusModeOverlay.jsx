import React, { useState, useEffect } from 'react';
import { useFocusMode } from '../context/FocusModeContext.jsx';
import {
  ShieldAlert,
  Clock,
  LogOut,
  Coins,
  CheckCircle2
} from 'lucide-react';

export const FocusModeOverlay = ({ onReturnHome }) => {
  const {
    isFocusActive,
    activeSessionTopic,
    sessionStartTime,
    freeExitsRemaining,
    nextExitCost,
    exitWarningModal,
    tabSwitchAlert,
    exitResultModal,
    requestExitSession,
    confirmExitSession,
    cancelExit,
    setTabSwitchAlert,
    setExitResultModal
  } = useFocusMode();

  const [sessionDuration, setSessionDuration] = useState('00:00');

  useEffect(() => {
    if (!isFocusActive || !sessionStartTime) return;
    const interval = setInterval(() => {
      const elapsedSecs = Math.floor((Date.now() - sessionStartTime) / 1000);
      const m = Math.floor(elapsedSecs / 60);
      const s = elapsedSecs % 60;
      setSessionDuration(`${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFocusActive, sessionStartTime]);

  if (!isFocusActive && !exitResultModal) return null;

  return (
    <>
      {/* Active Focus Header Bar inside Learning Space */}
      {isFocusActive && (
        <div className="focus-header-bar">
          <div className="flex items-center gap-3">
            <div className="focus-pulsing-badge">
              <span className="pulsing-dot"></span>
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Focus Mode Active
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-600 font-medium truncate max-w-xs">
              {activeSessionTopic}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{sessionDuration}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="step-out-pill">
                <span>Free Step-outs:</span>
                <strong className="font-bold text-slate-900">{freeExitsRemaining}/3</strong>
              </div>

              <button
                onClick={requestExitSession}
                className="btn-focus-exit"
                title="Early exit from Focus session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Detection Warning Modal */}
      {tabSwitchAlert && isFocusActive && (
        <div className="modal-backdrop">
          <div className="focus-alert-modal">
            <div className="alert-icon-ring alert-warning">
              <ShieldAlert className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">Tab Switch Detected</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              You navigated away from your learning workspace. The Focus Mode environment encourages single-task immersion to prepare you for technical placement drives.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 text-left">
              Leaving sessions beyond your 3 free step-outs will deduct points from your profile.
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setTabSwitchAlert(false)}
                className="btn-primary w-full"
              >
                Resume Learning
              </button>
              <button
                onClick={requestExitSession}
                className="btn-secondary w-full"
              >
                Exit Session Early
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {exitWarningModal && (
        <div className="modal-backdrop">
          <div className="focus-alert-modal">
            <h3 className="text-lg font-bold text-slate-900">Leave Focus Session?</h3>

            {freeExitsRemaining > 0 ? (
              <div className="mt-2 text-xs text-slate-600">
                <p>
                  You are using a free step-out token.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded mt-3 text-xs text-slate-700">
                  Remaining free exits after this: <strong className="text-slate-900 font-bold">{freeExitsRemaining - 1} of 3</strong> for today.
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  All 3 free daily step-outs have been used.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded mt-3 text-xs text-slate-700 flex items-center justify-between">
                  <span>Early exit fee:</span>
                  <strong className="text-slate-900 font-bold">-{nextExitCost} points</strong>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Points will be deducted from your profile balance.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={cancelExit}
                className="btn-secondary flex-1"
              >
                Stay in Session
              </button>
              <button
                onClick={() => confirmExitSession(onReturnHome)}
                className="btn-primary flex-1"
              >
                {freeExitsRemaining > 0 ? 'Use Free Exit' : `Pay ${nextExitCost} pts & Exit`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Result Modal / Toast */}
      {exitResultModal && (
        <div className="modal-backdrop">
          <div className="focus-alert-modal">
            <div className="alert-icon-ring alert-info">
              {exitResultModal.costPaid > 0 ? (
                <Coins className="w-6 h-6 text-blue-900" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-blue-900" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-3">
              {exitResultModal.costPaid > 0 ? 'Points Deducted' : 'Session Completed'}
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              {exitResultModal.message}
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-600">Current Balance:</span>
              <strong className="text-slate-900 font-bold">{exitResultModal.balanceAfter} pts</strong>
            </div>
            <button
              onClick={() => setExitResultModal(null)}
              className="btn-primary w-full mt-5"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
};
