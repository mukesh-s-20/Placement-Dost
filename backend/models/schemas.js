import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  age: { type: Number, default: 20 },
  college: { type: String, default: 'Chennai Institute of Technology' },
  department: { type: String, default: 'Computer Science & Engineering' },
  interestArea: { type: String, default: 'Machine Learning & AI' },
  topCareerChoice: { type: String, default: 'AI Engineer' },
  keyInterestTopics: [{ type: String }],
  points: { type: Number, default: 10 },
  streakDaily: { type: Number, default: 1 },
  streakWeekly: { type: Number, default: 1 },
  lastLoginDate: { type: String },
  freeExitsRemaining: { type: Number, default: 3 },
  exitCountToday: { type: Number, default: 0 },
  comprehensionBaseline: { type: Number, default: 0 },
  baselineCompleted: { type: Boolean, default: false },
  topicProficiencies: { type: Map, of: Number, default: {} },
  role: { type: String, default: 'student' },
  avatar: { type: String }
}, { timestamps: true });

const AssessmentResultSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  topic: { type: String, required: true },
  videoId: { type: String },
  writeUp: { type: String, required: true },
  rubricScores: {
    coreConceptAccuracy: Number,
    keyTermsUsed: Number,
    depth: Number,
    clarityCoherence: Number
  },
  totalScore: Number,
  normalizedScore: Number,
  referenceConcepts: [String],
  feedback: String
}, { timestamps: true });

const RoadmapSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  track: { type: String, required: true },
  topic: { type: String, required: true },
  title: String,
  stages: [mongoose.Schema.Types.Mixed],
  completedModules: [String],
  progressPercent: { type: Number, default: 0 }
}, { timestamps: true });

const ModuleSchema = new mongoose.Schema({
  moduleId: { type: String, required: true, unique: true },
  track: String,
  stageId: String,
  title: String,
  type: { type: String, enum: ['video', 'flashcard', 'prerequisite', 'project'] },
  status: { type: String, default: 'unlocked' },
  duration: String,
  videoUrl: String,
  summary: String,
  flashcards: [mongoose.Schema.Types.Mixed],
  projectDetails: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const AssignmentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  moduleId: String,
  topic: String,
  prompt: String,
  studentSubmission: String,
  referenceConcepts: [String],
  rubricScores: {
    coreConceptAccuracy: Number,
    keyTermsUsed: Number,
    depth: Number,
    clarityCoherence: Number
  },
  hiddenMarks: Number // Stored in MongoDB profile, hidden from student client
}, { timestamps: true });

const DSAProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  problemId: { type: String, required: true },
  difficulty: String,
  sourceSheet: String,
  status: { type: String, default: 'solved' },
  pointsEarned: Number,
  solvedAt: { type: String }
}, { timestamps: true });

const PeerSessionSchema = new mongoose.Schema({
  helpeeId: { type: String, required: true, index: true },
  helpeeName: String,
  helperId: { type: String, required: true, index: true },
  helperName: String,
  topic: String,
  status: { type: String, enum: ['requested', 'active', 'completed'], default: 'requested' },
  meetUrl: String,
  meetCode: String,
  helperPointsAwarded: { type: Number, default: 0 },
  remediationScoreBefore: Number,
  remediationScoreAfter: Number,
  notes: String,
  startedAt: String,
  completedAt: String
}, { timestamps: true });

const PointsLedgerSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  actionType: { type: String, required: true },
  description: String,
  balanceAfter: Number
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const AssessmentResultModel = mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', AssessmentResultSchema);
export const RoadmapModel = mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema);
export const ModuleModel = mongoose.models.Module || mongoose.model('Module', ModuleSchema);
export const AssignmentModel = mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
export const DSAProgressModel = mongoose.models.DSAProgress || mongoose.model('DSAProgress', DSAProgressSchema);
export const PeerSessionModel = mongoose.models.PeerSession || mongoose.model('PeerSession', PeerSessionSchema);
export const PointsLedgerModel = mongoose.models.PointsLedger || mongoose.model('PointsLedger', PointsLedgerSchema);
