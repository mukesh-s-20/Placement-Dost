import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle2, Lock, Clock } from 'lucide-react';

export const RestrictedVideoPlayer = ({ videoUrl, title, durationSeconds = 90, onVideoComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef(null);

  const totalDuration = durationSeconds;

  const handleStart = () => {
    if (isPlaying || isCompleted) return;
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying && !isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= totalDuration) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            setIsCompleted(true);
            if (onVideoComplete) onVideoComplete();
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isCompleted, totalDuration, onVideoComplete]);

  const progressPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const embedSrc = isPlaying || isCompleted
    ? `${videoUrl}?autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0`
    : `${videoUrl}?controls=0&disablekb=1&modestbranding=1&rel=0`;

  return (
    <div className="restricted-video-container">
      <div className="video-player-frame">
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="video-iframe"
        />

        {/* Linear Control Guard Overlay */}
        {!isPlaying && !isCompleted && (
          <div className="video-start-overlay">
            <div className="start-modal">
              <div className="lock-icon-badge">
                <Lock className="w-5 h-5 text-blue-900" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Linear Playback Required</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
                Seeking forward and skipping are disabled to establish an authentic baseline. Watch through the clip to unlock the comprehension check.
              </p>
              <button onClick={handleStart} className="btn-primary inline-flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                <span>Start Video ({formatTime(totalDuration)})</span>
              </button>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="video-completed-banner">
            <CheckCircle2 className="w-4 h-4" />
            <span>Playback completed. Write what you understood below.</span>
          </div>
        )}
      </div>

      {/* Progress & Restriction Monitor */}
      <div className="video-controls-guard">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatTime(elapsed)} / {formatTime(totalDuration)}</span>
          </div>
          <span>Linear Watch: {progressPercent}%</span>
        </div>

        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
