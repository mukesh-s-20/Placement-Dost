import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Code2,
  Flame,
  Upload,
  CheckCircle2,
  Play,
  FileSpreadsheet,
  Search,
  ExternalLink
} from 'lucide-react';

export const DSAPracticePage = () => {
  const { user, updateLocalPoints } = useAuth();

  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [dsaStatus, setDsaStatus] = useState(null);

  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterTopic, setFilterTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Code editor simulator state
  const [userCode, setUserCode] = useState('');
  const [activeLang, setActiveLang] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  // External Importer modal
  const [showImporter, setShowImporter] = useState(false);
  const [importSourceSheet, setImportSourceSheet] = useState('Custom College Sheet');
  const [importTextJson, setImportTextJson] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchProblemsAndStatus = async () => {
    if (!user?.id) return;
    try {
      const [probRes, statusRes] = await Promise.all([
        api.getDsaProblems({
          difficulty: filterDifficulty,
          topic: filterTopic,
          search: searchQuery
        }),
        api.getDsaStatus(user.id)
      ]);

      setProblems(probRes.problems || []);
      setDsaStatus(statusRes);

      const solvedSet = new Set((statusRes.progress || []).map(p => p.problemId));
      setSolvedIds(solvedSet);

      if (!selectedProblem && probRes.problems?.length > 0) {
        setSelectedProblem(probRes.problems[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProblemsAndStatus();
  }, [filterDifficulty, filterTopic, searchQuery, user?.id]);

  useEffect(() => {
    if (selectedProblem) {
      setUserCode(`// Problem: ${selectedProblem.title}\n// Language: ${activeLang}\n\nfunction solve(input) {\n  // Optimal solution\n  \n  return true;\n}`);
      setSubmissionFeedback(null);
    }
  }, [selectedProblem, activeLang]);

  const handleSolveSubmit = async () => {
    if (!user?.id || !selectedProblem) return;

    setSubmitting(true);
    try {
      const res = await api.solveDsaProblem({
        userId: user.id,
        problemId: selectedProblem.id,
        difficulty: selectedProblem.difficulty,
        sourceSheet: selectedProblem.sourceSheet,
        code: userCode,
        language: activeLang
      });

      if (res.success) {
        setSubmissionFeedback({
          success: true,
          pointsEarned: res.pointsEarned,
          message: `All test cases passed! +${res.pointsEarned} points awarded. Streak updated to ${res.streakDaily} days.`
        });
        updateLocalPoints(res.totalPoints);
        setSolvedIds(prev => new Set(prev).add(selectedProblem.id));
        setDsaStatus(prev => prev ? { ...prev, solvedToday: true, dailyStreak: res.streakDaily } : prev);
      }
    } catch (err) {
      setSubmissionFeedback({
        success: false,
        message: err.message || 'Submission failed'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImportResult(null);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('sourceSheet', importSourceSheet);
        res = await api.importDsaProblems(formData);
      } else if (importTextJson.trim()) {
        res = await api.importDsaProblems({
          problemsJson: importTextJson,
          sourceSheet: importSourceSheet
        });
      }

      if (res.success) {
        setImportResult(`Successfully imported ${res.count} problems into catalog.`);
        fetchProblemsAndStatus();
      } else {
        setImportResult(`Import failed: ${res.error}`);
      }
    } catch (err) {
      setImportResult(`Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="dsa-page-container space-y-5">
      {/* Daily Requirement & Streak Bar (§5) */}
      <div className="card-glass p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Flame className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Daily Requirement
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {dsaStatus?.solvedToday ? 'Today Completed ✓' : '1 Problem Required Today'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {dsaStatus?.dailyStreak || 1}-Day Active Problem Streak
            </h3>
            <p className="text-xs text-slate-600">
              Daily consistency scales your point economy and sprint rank.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500">Total Solved</span>
            <div className="text-sm font-bold text-slate-900">{solvedIds.size} Problems</div>
          </div>

          <button
            onClick={() => setShowImporter(true)}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <Upload className="w-4 h-4 text-slate-700" />
            <span>Import Sheet (Excel/CSV)</span>
          </button>
        </div>
      </div>

      {/* External Sheet Importer Modal (§5 Requirement) */}
      {showImporter && (
        <div className="modal-backdrop">
          <div className="importer-modal-content">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">Import External DSA Sheet</h3>
              </div>
              <button onClick={() => setShowImporter(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Upload an Excel (.xlsx) or CSV file (e.g. Striver SDE Sheet, Love Babbar 450, NeetCode 150) or paste problem JSON to track per student.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="input-label">Sheet Name / Category</label>
                <input
                  type="text"
                  value={importSourceSheet}
                  onChange={(e) => setImportSourceSheet(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="input-label">Option A: Upload Excel (.xlsx) or CSV File</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="input-field text-xs file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white"
                />
              </div>

              <div>
                <label className="input-label">Option B: Or Paste JSON Problem Array</label>
                <textarea
                  rows={3}
                  placeholder={`[{"title": "Valid Anagram", "difficulty": "Easy", "topic": "Strings"}]`}
                  value={importTextJson}
                  onChange={(e) => setImportTextJson(e.target.value)}
                  className="input-textarea text-xs font-mono"
                />
              </div>

              {importResult && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800">
                  {importResult}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowImporter(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="btn-primary text-xs"
                >
                  {importing ? 'Parsing...' : 'Parse & Ingest Problems'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main DSA Grid: Problem Browser (5 cols) & Interactive Solver (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Problems Catalog */}
        <div className="lg:col-span-5 card-glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Code2 className="w-4 h-4 text-slate-700" />
              <span>Problem Catalog ({problems.length})</span>
            </h4>
          </div>

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 text-xs py-1.5"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="input-field text-xs py-1"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy (+3 pts)</option>
                <option value="Medium">Medium (+8 pts)</option>
                <option value="Hard">Hard (+10 pts)</option>
              </select>

              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="input-field text-xs py-1"
              >
                <option value="All">All Topics</option>
                <option value="Arrays">Arrays & Hashing</option>
                <option value="Trees">Trees & BST</option>
                <option value="Dynamic">Dynamic Programming</option>
                <option value="Graphs">Graphs & BFS</option>
                <option value="Window">Sliding Window</option>
              </select>
            </div>
          </div>

          {/* Problem List */}
          <div className="dsa-list-scroll space-y-1.5">
            {problems.map(prob => {
              const isSolved = solvedIds.has(prob.id);
              const isSelected = selectedProblem?.id === prob.id;

              return (
                <div
                  key={prob.id}
                  onClick={() => setSelectedProblem(prob)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-900/40 text-blue-900 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSolved ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                    )}

                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">{prob.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span>{prob.topic}</span>
                        <span>•</span>
                        <span>{prob.sourceSheet}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {prob.difficulty} (+{prob.difficulty === 'Easy' ? 3 : prob.difficulty === 'Medium' ? 8 : 10})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: In-Browser Problem Scratchpad & Solver */}
        <div className="lg:col-span-7 card-glass p-5 space-y-3">
          {selectedProblem ? (
            <>
              {/* Problem Details */}
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {selectedProblem.difficulty} (+{selectedProblem.difficulty === 'Easy' ? 3 : selectedProblem.difficulty === 'Medium' ? 8 : 10} pts)
                    </span>
                    <span className="text-xs text-slate-500">{selectedProblem.topic}</span>
                  </div>

                  <a
                    href={selectedProblem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>LeetCode</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedProblem.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedProblem.description}</p>
                {selectedProblem.examples && (
                  <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono text-slate-800 border border-slate-200">
                    {selectedProblem.examples}
                  </div>
                )}
              </div>

              {/* Code Scratchpad */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Solution Scratchpad:</span>
                  <div className="flex gap-1">
                    {['javascript', 'python', 'cpp', 'java'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border transition-colors ${
                          activeLang === lang ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  rows={9}
                  className="input-textarea font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Feedback Alert */}
              {submissionFeedback && (
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50 text-xs flex items-center justify-between text-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                    <span>{submissionFeedback.message}</span>
                  </div>
                  {submissionFeedback.pointsEarned && (
                    <strong className="text-slate-900">
                      +{submissionFeedback.pointsEarned} pts
                    </strong>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  {solvedIds.has(selectedProblem.id) ? '✓ Problem already solved' : 'Solves update streak and rank.'}
                </span>

                <button
                  onClick={handleSolveSubmit}
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-2 py-1.5 px-4 font-semibold"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{submitting ? 'Running Tests...' : 'Run & Submit Solution'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select a problem from the catalog.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
