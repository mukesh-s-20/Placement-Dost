import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const FocusModeContext = createContext(null);

export const FocusModeProvider = ({ children }) => {
  const { user, updateLocalPoints } = useAuth();
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [activeSessionTopic, setActiveSessionTopic] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [exitWarningModal, setExitWarningModal] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [exitResultModal, setExitResultModal] = useState(null);
  const [freeExitsRemaining, setFreeExitsRemaining] = useState(3);
  const [nextExitCost, setNextExitCost] = useState(0);

  // Sync focus status with backend
  useEffect(() => {
    if (user?.id) {
      api.getFocusStatus(user.id).then(res => {
        setFreeExitsRemaining(res.freeExitsRemaining);
        setNextExitCost(res.nextExitCost);
      }).catch(err => console.warn('Could not sync focus status:', err.message));
    }
  }, [user?.id]);

  // Tab switch detection (visibilitychange & blur) while Focus Mode is active
  useEffect(() => {
    if (!isFocusActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchAlert(true);
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchAlert(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isFocusActive]);

  const enterFocusMode = (topicTitle) => {
    setIsFocusActive(true);
    setActiveSessionTopic(topicTitle || 'Learning Space');
    setSessionStartTime(Date.now());
    setTabSwitchAlert(false);

    // Request fullscreen if supported and permitted
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      // Ignore fullscreen denial
    }
  };

  const requestExitSession = () => {
    setExitWarningModal(true);
  };

  const confirmExitSession = async (onExitConfirmed) => {
    if (!user?.id) {
      setIsFocusActive(false);
      setExitWarningModal(false);
      if (onExitConfirmed) onExitConfirmed();
      return;
    }

    try {
      const res = await api.logFocusExit(user.id, 'User exited learning space early', activeSessionTopic);
      setFreeExitsRemaining(res.freeExitsRemaining);
      if (res.balanceAfter !== undefined) {
        updateLocalPoints(res.balanceAfter);
      }
      setIsFocusActive(false);
      setExitWarningModal(false);
      setTabSwitchAlert(false);

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      setExitResultModal(res);
      if (onExitConfirmed) onExitConfirmed();
    } catch (e) {
      console.error('Exit fee processing error:', e);
      setIsFocusActive(false);
      setExitWarningModal(false);
      if (onExitConfirmed) onExitConfirmed();
    }
  };

  const cancelExit = () => {
    setExitWarningModal(false);
    setTabSwitchAlert(false);
  };

  return (
    <FocusModeContext.Provider value={{
      isFocusActive,
      activeSessionTopic,
      sessionStartTime,
      freeExitsRemaining,
      nextExitCost,
      exitWarningModal,
      tabSwitchAlert,
      exitResultModal,
      enterFocusMode,
      requestExitSession,
      confirmExitSession,
      cancelExit,
      setTabSwitchAlert,
      setExitResultModal
    }}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => useContext(FocusModeContext);
