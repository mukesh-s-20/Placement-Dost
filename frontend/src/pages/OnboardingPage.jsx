import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RestrictedVideoPlayer } from '../components/RestrictedVideoPlayer.jsx';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Video,
  FileText,
  Users,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

export const OnboardingPage = ({ onComplete }) => {
  const { user, loginUser, loginWithGoogle, registerUser, switchUser } = useAuth();

  // Mode: 'register' | 'login'
  const [authMode, setAuthMode] = useState('register');
  const [step, setStep] = useState(1); // 1: Form, 2: Video & Recall, 3: Baseline Result

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('student@citchennai.net');
  const [googleNameInput, setGoogleNameInput] = useState('Student Engineer');
  const [googleLoading, setGoogleLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '20',
    college: 'Chennai Institute of Technology',
    customCollege: '',
    department: 'Computer Science & Engineering',
    interestArea: 'Machine Learning & AI',
    topCareerChoice: 'AI Engineer',
    keyInterestTopics: 'Supervised Learning, Loss Minimization, Model Generalization'
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [demoUsers, setDemoUsers] = useState([]);

  // Video & Recall State
  const [videoData, setVideoData] = useState(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [writeUp, setWriteUp] = useState('');
  const [referenceConcepts, setReferenceConcepts] = useState([]);
  const [gradingResult, setGradingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch demo users for easy testing
  useEffect(() => {
    api.getDemoUsers().then(res => {
      setDemoUsers(res.users || []);
    }).catch(err => console.warn(err));
  }, []);

  // Fetch video when moving to step 2
  useEffect(() => {
    if (step === 2) {
      const area = formData.interestArea || user?.interestArea || 'Machine Learning & AI';
      api.getOnboardingVideo(area).then(res => {
        setVideoData(res.video);
        if (res.video?.topic) {
          api.getReferenceConcepts(res.video.topic).then(cRes => {
            setReferenceConcepts(cRes.referenceConcepts || []);
          });
        }
      });
    }
  }, [step, formData.interestArea, user?.interestArea]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const collegeToUse = formData.college === 'Other' ? formData.customCollege : formData.college;
    const topicsArray = formData.keyInterestTopics.split(',').map(t => t.trim()).filter(Boolean);

    const res = await registerUser({
      ...formData,
      college: collegeToUse,
      keyInterestTopics: topicsArray
    });

    if (res.success) {
      setStep(2); // Proceed to personal video watch
    } else {
      setError(res.error);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await loginUser(loginEmail);
    if (res.success) {
      if (!res.user.baselineCompleted) {
        setStep(2);
      } else {
        onComplete();
      }
    } else {
      setError(res.error);
    }
  };

  // Google Sign-In Execution
  const handleGoogleAuth = async (email, name) => {
    setGoogleLoading(true);
    setError('');
    try {
      const targetEmail = email || googleEmailInput;
      const targetName = name || googleNameInput;
      const res = await loginWithGoogle({
        email: targetEmail,
        name: targetName,
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(targetName)}`
      });

      if (res.success) {
        setShowGoogleModal(false);
        setSuccessMsg(res.message || 'Connected via Google Account (+15 bonus points)');
        setTimeout(() => setSuccessMsg(''), 4000);

        if (!res.user.baselineCompleted) {
          setStep(2);
        } else {
          onComplete();
        }
      } else {
        setError(res.error || 'Google authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Google authentication encountered an error.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFastSwitch = (demoUser) => {
    switchUser(demoUser);
    onComplete();
  };

  const handleVideoCompleted = () => {
    setVideoWatched(true);
  };

  const handleGradeRecall = async (e) => {
    e.preventDefault();
    if (!writeUp.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.gradeRecallWriteUp({
        userId: user?.id,
        topic: videoData?.topic || 'ml_basics',
        videoId: videoData?.title || 'onboarding_intro',
        writeUp
      });

      if (res.success) {
        setGradingResult(res);
        setStep(3); // Result & Baseline view
      } else {
        setError(res.error || 'Failed to grade recall write-up');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page-bg">
      <div className="onboarding-card">
        {/* Brand Banner */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="brand-logo-icon w-10 h-10">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Placement Dost</h1>
            <p className="text-xs text-slate-500 font-medium">
              AI Placement Prep Platform
            </p>
          </div>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 1 ? 'text-[#1e40af]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 1 ? 'bg-[#1e40af] text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>Profile</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-[#1e40af]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 2 ? 'text-[#1e40af]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 2 ? 'bg-[#1e40af] text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>Video Recall</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-[#1e40af]' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 3 ? 'text-[#1e40af]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step >= 3 ? 'bg-[#1e40af] text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Baseline</span>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {/* STEP 1: AUTH & ONBOARDING FORM */}
        {step === 1 && (
          <div>
            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-2.5 py-2 px-3 border border-slate-300 rounded bg-white hover:bg-slate-50 transition-colors shadow-sm text-xs font-semibold text-slate-700 mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
              <span className="ml-auto text-[10px] bg-blue-50 text-[#1e40af] font-bold px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> +15 pts
              </span>
            </button>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-semibold">Or use email profile</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-slate-100 p-1 rounded border border-slate-200 mb-5">
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  authMode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Student Onboarding
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Existing Student Sign In
              </button>
            </div>

            {authMode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Student Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mukesh S"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="input-label">Age</label>
                    <input
                      type="number"
                      required
                      min="17"
                      max="35"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">College / University</label>
                    <select
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      className="input-field"
                    >
                      <option value="Chennai Institute of Technology">Chennai Institute of Technology (CIT)</option>
                      <option value="IIT Madras">IIT Madras</option>
                      <option value="Anna University">Anna University</option>
                      <option value="BITS Pilani">BITS Pilani</option>
                      <option value="Other">Other College...</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Department / Focus</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="input-field"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                    </select>
                  </div>
                </div>

                {formData.college === 'Other' && (
                  <div>
                    <label className="input-label">Enter College Name</label>
                    <input
                      type="text"
                      required
                      placeholder="College Name"
                      value={formData.customCollege}
                      onChange={(e) => setFormData({ ...formData, customCollege: e.target.value })}
                      className="input-field"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Primary Interest Area</label>
                    <select
                      value={formData.interestArea}
                      onChange={(e) => setFormData({ ...formData, interestArea: e.target.value })}
                      className="input-field"
                    >
                      <option value="Machine Learning & AI">Machine Learning & AI</option>
                      <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                      <option value="CS Fundamentals">CS Fundamentals (OS, DBMS, CN)</option>
                      <option value="Full Stack & System Design">Full Stack & System Design</option>
                      <option value="Aptitude & Reasoning">Aptitude & Reasoning</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Top Career Choice</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SDE (Tier-1), AI Engineer"
                      value={formData.topCareerChoice}
                      onChange={(e) => setFormData({ ...formData, topCareerChoice: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Key Interest Topics (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Binary Trees, Dynamic Programming, Supervised Learning"
                    value={formData.keyInterestTopics}
                    onChange={(e) => setFormData({ ...formData, keyInterestTopics: e.target.value })}
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-4 font-semibold">
                  <span>Continue to Baseline Video</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="input-label">Student Email / ID</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aarav.s@citchennai.net"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-2 font-semibold">
                  Sign In
                </button>
              </form>
            )}

            {/* Quick Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2.5">
                <Users className="w-3.5 h-3.5 text-slate-700" />
                <span>Quick Evaluator Logins:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {demoUsers.slice(0, 4).map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleFastSwitch(u)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-colors"
                  >
                    <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{u.college}</p>
                    <span className="text-[10px] text-[#1e40af] font-bold">{u.points} pts</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PERSONALIZED VIDEO & RECALL WRITE-UP */}
        {step === 2 && videoData && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <Video className="w-3.5 h-3.5 text-slate-700" />
                <span>Personalization Step: Linear Video</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{videoData.title}</h3>
              <p className="text-xs text-slate-600">{videoData.description}</p>
            </div>

            {/* Restricted Video Player */}
            <RestrictedVideoPlayer
              videoUrl={videoData.videoUrl}
              title={videoData.title}
              durationSeconds={45} // 45 seconds for evaluation
              onVideoComplete={handleVideoCompleted}
            />

            {/* Scoped Reference Concepts Preview */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Scoped Reference Concepts (Benchmark Terms)</span>
                </span>
                <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                  Fixed Rubric Match
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {referenceConcepts.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white text-slate-700 rounded text-xs border border-slate-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Recall Write-Up Box */}
            <form onSubmit={handleGradeRecall} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="input-label flex items-center gap-1.5 text-slate-900">
                  <FileText className="w-3.5 h-3.5 text-slate-700" />
                  <span>Write what you understood from the video:</span>
                </label>
                {!videoWatched && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Linear playback required to submit)
                  </span>
                )}
              </div>

              <textarea
                value={writeUp}
                onChange={(e) => setWriteUp(e.target.value)}
                rows={4}
                placeholder="In your own words, synthesize the core principles, key technical terms, cause/effect, and trade-offs explained in the video..."
                className="input-textarea text-xs"
                required
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  Evaluated across 4 fixed dimensions (Accuracy, Terms, Depth, Clarity)
                </span>
                <button
                  type="submit"
                  disabled={loading || !writeUp.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? 'Evaluating Comprehension...' : 'Submit & Calculate Baseline'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: BASELINE RESULTS & RUBRIC BREAKDOWN */}
        {step === 3 && gradingResult && (
          <div className="space-y-4 text-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Comprehension Baseline Established
              </span>
              <div className="text-4xl font-bold text-slate-900 mt-2">
                {gradingResult.normalizedScore} <span className="text-base text-slate-500">/ 100</span>
              </div>
            </div>

            {/* Fixed 4-Dimension Rubric Breakdown Table */}
            <div className="bg-slate-50 rounded p-4 border border-slate-200 text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
                Fixed Rubric Scoring Breakdown (0–3 Scale)
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Core Concept Accuracy</span>
                  <strong className="text-sm text-slate-900">{gradingResult.rubricScores.coreConceptAccuracy} / 3</strong>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Key Terms Used Correctly</span>
                  <strong className="text-sm text-slate-900">{gradingResult.rubricScores.keyTermsUsed} / 3</strong>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Depth & Elaboration</span>
                  <strong className="text-sm text-slate-900">{gradingResult.rubricScores.depth} / 3</strong>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[11px]">Clarity & Coherence</span>
                  <strong className="text-sm text-slate-900">{gradingResult.rubricScores.clarityCoherence} / 3</strong>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-700 border-t border-slate-200">
                <strong className="text-slate-900">AI Feedback: </strong>
                {gradingResult.feedback}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 text-left flex items-center justify-between">
              <span>Saved to Student Profile</span>
              <strong className="text-slate-900 font-bold">+5 Onboarding pts</strong>
            </div>

            <button
              onClick={onComplete}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              <span>Enter Placement Dost Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Google Authentication Dialog Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-sm w-full p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-bold text-slate-900">Sign in with Google</span>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4">
              Select or enter your institutional Google account to securely authenticate and access Placement Dost.
            </p>

            {/* Quick 1-Click Google Institutional Profiles */}
            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() => handleGoogleAuth('mukesh.s@citchennai.net', 'Mukesh S (CIT Student)')}
                className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded text-left transition-colors"
              >
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=Mukesh"
                  alt="avatar"
                  className="w-7 h-7 rounded-full bg-blue-100"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">Mukesh S</p>
                  <p className="text-[11px] text-slate-500">mukesh.s@citchennai.net</p>
                </div>
                <span className="ml-auto text-[10px] text-[#1e40af] font-semibold bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                  CIT Verified
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleAuth('priya.r@citchennai.net', 'Priya Raman')}
                className="w-full flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded text-left transition-colors"
              >
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=Priya"
                  alt="avatar"
                  className="w-7 h-7 rounded-full bg-purple-100"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">Priya Raman</p>
                  <p className="text-[11px] text-slate-500">priya.r@citchennai.net</p>
                </div>
                <span className="ml-auto text-[10px] text-[#1e40af] font-semibold bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                  CIT Verified
                </span>
              </button>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <label className="input-label">Or Custom Google Email</label>
              <input
                type="email"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                placeholder="your.email@college.edu"
                className="input-field text-xs mb-2"
              />
              <input
                type="text"
                value={googleNameInput}
                onChange={(e) => setGoogleNameInput(e.target.value)}
                placeholder="Full Name"
                className="input-field text-xs mb-3"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn-secondary flex-1 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={googleLoading || !googleEmailInput.trim()}
                  onClick={() => handleGoogleAuth()}
                  className="btn-primary flex-1 py-1.5 text-xs flex items-center justify-center gap-1.5"
                >
                  {googleLoading ? 'Connecting...' : 'Authorize'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
