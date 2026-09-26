import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFocusMode } from '../context/FocusModeContext.jsx';
import { RestrictedVideoPlayer } from '../components/RestrictedVideoPlayer.jsx';
import { FlashcardViewer } from '../components/FlashcardViewer.jsx';
import { InterpretationModal } from '../components/InterpretationModal.jsx';
import { AssignmentModal } from '../components/AssignmentModal.jsx';
import { RemediationBanner } from '../components/RemediationBanner.jsx';
import {
  Brain,
  Code2,
  Cpu,
  FolderGit2,
  CheckCircle2,
  Play,
  Layers,
  AlertCircle,
  Eye,
  FileEdit,
  RotateCcw
} from 'lucide-react';

export const LearningSpacePage = ({ onNavigateToPeer }) => {
  const { user, updateLocalPoints } = useAuth();
  const { enterFocusMode } = useFocusMode();

  const [selectedTrack, setSelectedTrack] = useState('dsa'); // 'aptitude' | 'dsa' | 'cs_fundamentals' | 'projects'
  const [roadmap, setRoadmap] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);

  // Modals & Popups
  const [showInterpretationModal, setShowInterpretationModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [strugglingTopic, setStrugglingTopic] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Enter Focus Mode upon landing in Learning Space
  useEffect(() => {
    enterFocusMode(`Track: ${selectedTrack.toUpperCase()}`);
  }, [selectedTrack]);

  // Load roadmap
  useEffect(() => {
    if (!user?.id) return;
    setLoadingRoadmap(true);
    api.getRoadmap(user.id, selectedTrack)
      .then(res => {
        setRoadmap(res.roadmap);
        if (res.roadmap?.stages?.[0]?.modules?.[0]) {
          setActiveModule(res.roadmap.stages[0].modules[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingRoadmap(false));
  }, [selectedTrack, user?.id]);

  // Check if user is struggling in current topic
  useEffect(() => {
    if (user?.id && activeModule?.title) {
      api.getRemediation(user.id, activeModule.title).then(res => {
        if (res.isStruggling) {
          setStrugglingTopic(res.topic);
        } else {
          setStrugglingTopic(null);
        }
      }).catch(err => console.warn(err));
    }
  }, [activeModule?.title, user?.id]);

  const handleCompleteModule = async (moduleId) => {
    if (!user?.id || !activeModule) return;
    try {
      const res = await api.completeModule(user.id, selectedTrack, roadmap?.stages?.[0]?.stageId, moduleId);
      if (res.success) {
        updateLocalPoints(res.balanceAfter);
        setActionMessage(`Module completed (+1 point added).`);
        setTimeout(() => setActionMessage(''), 4000);
        setActiveModule(prev => prev ? { ...prev, status: 'completed' } : prev);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecompleteModule = async (moduleId) => {
    if (!user?.id) return;
    try {
      const res = await api.recompleteModule(user.id, moduleId);
      if (res.success) {
        updateLocalPoints(res.balanceAfter);
        setActionMessage(`Module reviewed & re-completed (+1 point).`);
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tracksList = [
    { id: 'aptitude', name: 'Aptitude & Reasoning', icon: Brain },
    { id: 'dsa', name: 'Data Structures & Algorithms', icon: Code2 },
    { id: 'cs_fundamentals', name: 'CS Fundamentals', icon: Cpu },
    { id: 'projects', name: 'Projects (Guided Track)', icon: FolderGit2 }
  ];

  return (
    <div className="learning-space-layout space-y-4">
      {/* Track Selection Bar */}
      <div className="track-selector-bar">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {tracksList.map(t => {
            const Icon = t.icon;
            const isSelected = selectedTrack === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTrack(t.id)}
                className={`track-tab-btn ${isSelected ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-xs whitespace-nowrap">{t.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInterpretationModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Formative concept test"
          >
            <Eye className="w-3.5 h-3.5 text-slate-700" />
            <span>Interpretation Check</span>
          </button>

          <button
            onClick={() => setShowAssignmentModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Fixed-rubric module assignment"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Submit Assignment</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      {/* Struggling Detection & Remediation Banner (§4 Step 6) */}
      {strugglingTopic && (
        <RemediationBanner
          topic={strugglingTopic}
          onRequestPeerHelp={() => {
            if (onNavigateToPeer) onNavigateToPeer();
          }}
        />
      )}

      {/* Main Learning Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
        {/* LEFT COLUMN: AI Generated Roadmap Navigation (4 cols) */}
        <div className="lg:col-span-4 card-glass p-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Curriculum Stages
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">{roadmap?.title || 'Personalized Track'}</h4>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {roadmap?.progressPercent || 0}% Done
            </span>
          </div>

          {loadingRoadmap ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              Loading curriculum stages...
            </div>
          ) : (
            <div className="space-y-4">
              {roadmap?.stages?.map((stage, stageIdx) => (
                <div key={stage.stageId || stageIdx} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <span className="w-5 h-5 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-700">
                      {stageIdx + 1}
                    </span>
                    <span>{stage.title}</span>
                  </div>

                  <div className="space-y-1 pl-3 border-l border-slate-200">
                    {stage.modules?.map(mod => {
                      const isActive = activeModule?.moduleId === mod.moduleId;
                      const isDone = mod.status === 'completed';

                      return (
                        <button
                          key={mod.moduleId}
                          onClick={() => setActiveModule(mod)}
                          className={`w-full text-left p-2 rounded text-xs transition-colors flex items-start gap-2 ${
                            isActive
                              ? 'bg-blue-50 border border-blue-900/30 text-blue-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                            ) : mod.type === 'video' ? (
                              <Play className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            ) : mod.type === 'flashcard' ? (
                              <Layers className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            ) : mod.type === 'prerequisite' ? (
                              <AlertCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            ) : (
                              <FolderGit2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="truncate">{mod.title}</p>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                              {mod.type} {mod.duration ? `• ${mod.duration}` : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Module Content Viewer (8 cols) */}
        <div className="lg:col-span-8 card-glass p-5">
          {activeModule ? (
            <div className="space-y-4">
              {/* Module Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {activeModule.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{activeModule.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {activeModule.status === 'completed' && (
                    <button
                      onClick={() => handleRecompleteModule(activeModule.moduleId)}
                      className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5"
                      title="Review (+1 pt)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Review (+1 pt)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* VIDEO MODULE */}
              {activeModule.type === 'video' && (
                <div className="space-y-3">
                  <RestrictedVideoPlayer
                    videoUrl={activeModule.videoUrl || 'https://www.youtube.com/embed/vRwi_UcZGjU'}
                    title={activeModule.title}
                    durationSeconds={45} // 45s for demo testing
                    onVideoComplete={() => handleCompleteModule(activeModule.moduleId)}
                  />

                  {activeModule.summary && (
                    <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900 block mb-1">Key Curriculum Points:</strong>
                      <p>{activeModule.summary}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Linear watch completes the module (+1 point).
                    </span>
                    <button
                      onClick={() => handleCompleteModule(activeModule.moduleId)}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Completed (+1 pt)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* FLASHCARD MODULE */}
              {activeModule.type === 'flashcard' && (
                <FlashcardViewer
                  flashcards={activeModule.flashcards}
                  moduleTitle={activeModule.title}
                  onCompleteModule={() => handleCompleteModule(activeModule.moduleId)}
                />
              )}

              {/* PREREQUISITE POINTER MODULE */}
              {activeModule.type === 'prerequisite' && (
                <div className="p-6 bg-slate-50 rounded border border-slate-200 text-center space-y-3">
                  <div className="w-10 h-10 bg-slate-200 border border-slate-300 rounded-full flex items-center justify-center mx-auto text-slate-800">
                    <AlertCircle className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Prerequisite Foundational Gap
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {activeModule.prerequisiteTopic || 'Recursion Call Stack & Invariants'}
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                      Placement Dost identified a conceptual foundation that should be consolidated before moving into advanced tree balancing and graph algorithms.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700 max-w-sm mx-auto text-left">
                    <p className="font-semibold text-slate-900 mb-1">Foundation Checklist:</p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Activation stack frame unwinding</li>
                      <li>Base case termination proofs</li>
                      <li>Space complexity of call stack O(H)</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleCompleteModule(activeModule.moduleId)}
                    className="btn-primary text-xs py-1.5 px-4"
                  >
                    Confirm Prerequisite Mastery (+1 pt)
                  </button>
                </div>
              )}

              {/* PROJECT-BASED LEARNING MODULE (§6) */}
              {activeModule.type === 'project' && activeModule.projectDetails && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-slate-600">Project Track Milestone</span>
                      <span className="text-xs font-bold text-slate-900">+10 Milestone Pts</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{activeModule.projectDetails.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{activeModule.projectDetails.specs}</p>
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Interactive Project Milestones:
                    </h5>
                    {activeModule.projectDetails.milestones?.map((m, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded text-xs flex items-center justify-between text-slate-700">
                        <span>{m}</span>
                        <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleCompleteModule(activeModule.moduleId)}
                    className="btn-primary text-xs w-full py-2 mt-2 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Completed Milestone (+10 pts)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Select a module from the roadmap to view content.
            </div>
          )}
        </div>
      </div>

      {/* Formative Interpretation Check Modal (§4 Step 4) */}
      <InterpretationModal
        isOpen={showInterpretationModal}
        onClose={() => setShowInterpretationModal(false)}
        visualId="tree_rotation"
      />

      {/* Module Technical Assignment Modal (§4 Step 5) */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        module={activeModule}
        topic={activeModule?.title}
        onStruggleDetected={(topic) => setStrugglingTopic(topic)}
      />
    </div>
  );
};
