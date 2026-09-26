import { jsonDb, isMongoConnected } from '../config/db.js';
import crypto from 'crypto';
import {
  UserModel,
  AssessmentResultModel,
  RoadmapModel,
  ModuleModel,
  AssignmentModel,
  DSAProgressModel,
  PeerSessionModel,
  PointsLedgerModel
} from './schemas.js';

export class Repository {
  static getCollection(name) {
    return jsonDb.getCollection(name);
  }

  // USERS
  static async getUsers() {
    if (isMongoConnected) {
      try {
        const mongoUsers = await UserModel.find().lean();
        if (mongoUsers.length > 0) return mongoUsers;
      } catch (err) {
        console.warn('MongoDB query fallback:', err.message);
      }
    }
    return jsonDb.getCollection('users');
  }

  static async getUserById(id) {
    if (isMongoConnected) {
      try {
        const u = await UserModel.findOne({ $or: [{ id }, { _id: id }] }).lean();
        if (u) return u;
      } catch (err) {
        console.warn('MongoDB query fallback:', err.message);
      }
    }
    const users = jsonDb.getCollection('users');
    return users.find(u => u.id === id || u._id === id);
  }

  static async getUserByEmail(email) {
    if (isMongoConnected) {
      try {
        const u = await UserModel.findOne({ email: email.toLowerCase() }).lean();
        if (u) return u;
      } catch (err) {
        console.warn('MongoDB query fallback:', err.message);
      }
    }
    const users = jsonDb.getCollection('users');
    return users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
  }

  static async createUser(userData) {
    const users = jsonDb.getCollection('users');
    const newUser = {
      id: userData.id || `user_${crypto.randomUUID().slice(0, 8)}`,
      _id: userData.id || `user_${crypto.randomUUID().slice(0, 8)}`,
      name: userData.name || 'Student',
      email: userData.email || `student_${Date.now()}@college.edu`,
      age: userData.age || 20,
      college: userData.college || 'Chennai Institute of Technology',
      department: userData.department || 'Computer Science & Engineering',
      interestArea: userData.interestArea || 'Machine Learning & AI',
      topCareerChoice: userData.topCareerChoice || 'AI Engineer',
      keyInterestTopics: userData.keyInterestTopics || ['Supervised Learning', 'Binary Search Trees'],
      points: userData.points !== undefined ? userData.points : 10,
      streakDaily: userData.streakDaily || 1,
      streakWeekly: userData.streakWeekly || 1,
      lastLoginDate: new Date().toISOString(),
      freeExitsRemaining: userData.freeExitsRemaining !== undefined ? userData.freeExitsRemaining : 3,
      exitCountToday: userData.exitCountToday || 0,
      comprehensionBaseline: userData.comprehensionBaseline || 0,
      baselineCompleted: !!userData.baselineCompleted,
      topicProficiencies: userData.topicProficiencies || {},
      role: userData.role || 'student',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name || 'student')}`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    jsonDb.save();

    if (isMongoConnected) {
      UserModel.create(newUser).catch(err => console.warn('Mongo user sync:', err.message));
    }

    return newUser;
  }

  static async updateUser(id, updates) {
    const users = jsonDb.getCollection('users');
    const idx = users.findIndex(u => u.id === id || u._id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    jsonDb.save();

    if (isMongoConnected) {
      UserModel.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, updates).catch(err => console.warn('Mongo update sync:', err.message));
    }

    return users[idx];
  }

  // POINTS & LEDGER
  static async addPoints(userId, pointsDelta, action, description) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const oldPoints = user.points || 0;
    const newPoints = Math.max(0, oldPoints + pointsDelta);
    await this.updateUser(userId, { points: newPoints });

    const ledger = jsonDb.getCollection('pointsLedger');
    const entry = {
      id: `entry_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      action,
      pointsDelta,
      balanceAfter: newPoints,
      description: description || action,
      createdAt: new Date().toISOString()
    };
    ledger.unshift(entry);
    jsonDb.save();
    return { user: { ...user, points: newPoints }, entry };
  }

  static async getPointsLedger(userId) {
    const ledger = jsonDb.getCollection('pointsLedger');
    if (userId) {
      return ledger.filter(l => l.userId === userId);
    }
    return ledger;
  }

  // ASSESSMENT RESULTS
  static async saveAssessmentResult(data) {
    const assessments = jsonDb.getCollection('assessmentResults');
    const item = {
      id: data.id || `assess_${crypto.randomUUID().slice(0, 8)}`,
      userId: data.userId,
      topic: data.topic,
      videoId: data.videoId,
      writeUp: data.writeUp,
      rubricScores: data.rubricScores,
      totalScore: data.totalScore,
      normalizedScore: data.normalizedScore,
      referenceConcepts: data.referenceConcepts || [],
      feedback: data.feedback || '',
      isRemediationCandidate: data.normalizedScore < 60,
      createdAt: new Date().toISOString()
    };
    assessments.push(item);
    jsonDb.save();

    // Update user's comprehension baseline & topic proficiency
    const user = await this.getUserById(data.userId);
    if (user) {
      const topicProficiencies = { ...(user.topicProficiencies || {}) };
      topicProficiencies[data.topic] = data.normalizedScore;
      await this.updateUser(data.userId, {
        comprehensionBaseline: data.normalizedScore,
        baselineCompleted: true,
        topicProficiencies
      });
    }

    return item;
  }

  static async getAssessmentResults(userId) {
    const assessments = jsonDb.getCollection('assessmentResults');
    return userId ? assessments.filter(a => a.userId === userId) : assessments;
  }

  // ROADMAPS
  static async getRoadmap(userId, track, topic) {
    const roadmaps = jsonDb.getCollection('roadmaps');
    return roadmaps.find(r => r.userId === userId && r.track === track && (!topic || r.topic === topic));
  }

  static async saveRoadmap(roadmapData) {
    const roadmaps = jsonDb.getCollection('roadmaps');
    const idx = roadmaps.findIndex(r => r.userId === roadmapData.userId && r.track === roadmapData.track);
    if (idx !== -1) {
      roadmaps[idx] = { ...roadmaps[idx], ...roadmapData, updatedAt: new Date().toISOString() };
      jsonDb.save();
      return roadmaps[idx];
    }
    const newRoadmap = {
      id: `roadmap_${crypto.randomUUID().slice(0, 8)}`,
      ...roadmapData,
      createdAt: new Date().toISOString()
    };
    roadmaps.push(newRoadmap);
    jsonDb.save();
    return newRoadmap;
  }

  // ASSIGNMENTS (Hidden marks for struggling detection)
  static async saveAssignment(data) {
    const assignments = jsonDb.getCollection('assignments');
    const assignment = {
      id: `assign_${crypto.randomUUID().slice(0, 8)}`,
      userId: data.userId,
      moduleId: data.moduleId,
      topic: data.topic,
      prompt: data.prompt,
      studentSubmission: data.studentSubmission,
      referenceConcepts: data.referenceConcepts || [],
      rubricScores: data.rubricScores,
      hiddenMarks: data.hiddenMarks, // Hidden from student!
      struggleDetected: data.hiddenMarks < 60,
      createdAt: new Date().toISOString()
    };
    assignments.push(assignment);
    jsonDb.save();
    return assignment;
  }

  static async getAssignments(userId) {
    const assignments = jsonDb.getCollection('assignments');
    return userId ? assignments.filter(a => a.userId === userId) : assignments;
  }

  // DSA PROBLEMS & PROGRESS
  static async getDsaProblems() {
    return jsonDb.getCollection('dsaProblems');
  }

  static async addDsaProblems(problems) {
    const list = jsonDb.getCollection('dsaProblems');
    for (const p of problems) {
      if (!p.id) p.id = `dsa_${crypto.randomUUID().slice(0, 8)}`;
      list.push(p);
    }
    jsonDb.save();
    return list;
  }

  static async getDsaProgress(userId) {
    const progress = jsonDb.getCollection('dsaProgress');
    return progress.filter(p => p.userId === userId);
  }

  static async recordDsaSolve(userId, problemId, difficulty, pointsEarned, sourceSheet) {
    const progress = jsonDb.getCollection('dsaProgress');
    const existing = progress.find(p => p.userId === userId && p.problemId === problemId);
    if (existing) {
      existing.status = 'solved';
      existing.solvedAt = new Date().toISOString();
      jsonDb.save();
      return existing;
    }
    const record = {
      id: `prog_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      problemId,
      difficulty,
      sourceSheet: sourceSheet || 'Standard Sheet',
      status: 'solved',
      pointsEarned,
      solvedAt: new Date().toISOString()
    };
    progress.push(record);
    jsonDb.save();
    return record;
  }

  // PEER SESSIONS
  static generateGoogleMeetUrl(sessionId) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let seed = sessionId || 'placement-dost';
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
    }
    const getCode = (len, salt) => {
      let res = '';
      for (let i = 0; i < len; i++) {
        const val = Math.abs(Math.sin(hash + salt + i * 17) * 10000);
        res += letters[Math.floor(val) % letters.length];
      }
      return res;
    };
    const code = `${getCode(3, 1)}-${getCode(4, 7)}-${getCode(3, 13)}`;
    return `https://meet.google.com/${code}`;
  }

  static async createPeerSession(data) {
    const sessions = jsonDb.getCollection('peerSessions');
    const sessionId = `peer_${crypto.randomUUID().slice(0, 8)}`;
    const meetUrl = data.meetUrl || Repository.generateGoogleMeetUrl(sessionId);
    const session = {
      id: sessionId,
      helpeeId: data.helpeeId,
      helpeeName: data.helpeeName,
      helperId: data.helperId,
      helperName: data.helperName,
      topic: data.topic,
      meetUrl,
      meetCode: meetUrl.replace('https://meet.google.com/', ''),
      status: 'requested', // requested -> active -> completed
      helperPointsAwarded: 0,
      remediationScoreBefore: data.remediationScoreBefore || 45,
      remediationScoreAfter: null,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };
    sessions.unshift(session);
    jsonDb.save();
    return session;
  }

  static async getPeerSessions(userId) {
    const sessions = jsonDb.getCollection('peerSessions');
    // Ensure all existing sessions have a valid meetUrl
    sessions.forEach(s => {
      if (!s.meetUrl) {
        s.meetUrl = Repository.generateGoogleMeetUrl(s.id);
        s.meetCode = s.meetUrl.replace('https://meet.google.com/', '');
      }
    });
    if (!userId) return sessions;
    return sessions.filter(s => s.helpeeId === userId || s.helperId === userId);
  }

  static async updatePeerSession(sessionId, updates) {
    const sessions = jsonDb.getCollection('peerSessions');
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return null;
    const existing = sessions[idx];
    const meetUrl = updates.meetUrl || existing.meetUrl || Repository.generateGoogleMeetUrl(sessionId);
    sessions[idx] = {
      ...existing,
      ...updates,
      meetUrl,
      meetCode: meetUrl.replace('https://meet.google.com/', ''),
      updatedAt: new Date().toISOString()
    };
    jsonDb.save();
    return sessions[idx];
  }
}
