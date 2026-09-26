import { jsonDb, isPostgresConnected, pgPool } from '../config/postgres.js';
import crypto from 'crypto';

export class Repository {
  static getCollection(name) {
    return jsonDb.getCollection(name);
  }

  // GOOGLE MEET LINK GENERATOR
  // Uses https://meet.google.com/new so Google Meet immediately launches a 100% valid meeting!
  static generateGoogleMeetUrl() {
    return 'https://meet.google.com/new';
  }

  // ==================== USERS ====================
  static async getUsers() {
    if (isPostgresConnected && pgPool) {
      try {
        const { rows } = await pgPool.query('SELECT * FROM users ORDER BY points DESC');
        if (rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
            _id: r.id,
            name: r.name,
            email: r.email,
            age: r.age,
            college: r.college,
            department: r.department,
            interestArea: r.interest_area,
            topCareerChoice: r.top_career_choice,
            keyInterestTopics: r.key_interest_topics || [],
            points: r.points,
            streakDaily: r.streak_daily,
            streakWeekly: r.streak_weekly,
            freeExitsRemaining: r.free_exits_remaining,
            exitCountToday: r.exit_count_today,
            comprehensionBaseline: r.comprehension_baseline,
            baselineCompleted: r.baseline_completed,
            topicProficiencies: r.topic_proficiencies || {},
            role: r.role,
            avatar: r.avatar
          }));
        }
      } catch (err) {
        console.warn('PostgreSQL users query fallback:', err.message);
      }
    }
    return jsonDb.getCollection('users');
  }

  static async getUserById(id) {
    if (isPostgresConnected && pgPool) {
      try {
        const { rows } = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            _id: r.id,
            name: r.name,
            email: r.email,
            age: r.age,
            college: r.college,
            department: r.department,
            interestArea: r.interest_area,
            topCareerChoice: r.top_career_choice,
            keyInterestTopics: r.key_interest_topics || [],
            points: r.points,
            streakDaily: r.streak_daily,
            streakWeekly: r.streak_weekly,
            freeExitsRemaining: r.free_exits_remaining,
            exitCountToday: r.exit_count_today,
            comprehensionBaseline: r.comprehension_baseline,
            baselineCompleted: r.baseline_completed,
            topicProficiencies: r.topic_proficiencies || {},
            role: r.role,
            avatar: r.avatar
          };
        }
      } catch (err) {
        console.warn('PostgreSQL user query fallback:', err.message);
      }
    }
    const users = jsonDb.getCollection('users');
    return users.find(u => u.id === id || u._id === id);
  }

  static async getUserByEmail(email) {
    if (isPostgresConnected && pgPool) {
      try {
        const { rows } = await pgPool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        if (rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            _id: r.id,
            name: r.name,
            email: r.email,
            age: r.age,
            college: r.college,
            department: r.department,
            interestArea: r.interest_area,
            topCareerChoice: r.top_career_choice,
            keyInterestTopics: r.key_interest_topics || [],
            points: r.points,
            streakDaily: r.streak_daily,
            streakWeekly: r.streak_weekly,
            freeExitsRemaining: r.free_exits_remaining,
            exitCountToday: r.exit_count_today,
            comprehensionBaseline: r.comprehension_baseline,
            baselineCompleted: r.baseline_completed,
            topicProficiencies: r.topic_proficiencies || {},
            role: r.role,
            avatar: r.avatar
          };
        }
      } catch (err) {
        console.warn('PostgreSQL email query fallback:', err.message);
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

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO users (id, name, email, age, college, department, interest_area, top_career_choice, key_interest_topics, points, streak_daily, streak_weekly, free_exits_remaining, comprehension_baseline, baseline_completed, role, avatar)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (email) DO UPDATE SET points = EXCLUDED.points`,
          [
            newUser.id, newUser.name, newUser.email, newUser.age, newUser.college,
            newUser.department, newUser.interestArea, newUser.topCareerChoice,
            newUser.keyInterestTopics, newUser.points, newUser.streakDaily, newUser.streakWeekly,
            newUser.freeExitsRemaining, newUser.comprehensionBaseline, newUser.baselineCompleted,
            newUser.role, newUser.avatar
          ]
        );
      } catch (err) {
        console.warn('PostgreSQL insert user sync:', err.message);
      }
    }

    return newUser;
  }

  static async updateUser(id, updates) {
    const users = jsonDb.getCollection('users');
    const idx = users.findIndex(u => u.id === id || u._id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    jsonDb.save();

    if (isPostgresConnected && pgPool) {
      try {
        const fields = [];
        const values = [];
        let i = 1;
        if (updates.points !== undefined) { fields.push(`points = $${i++}`); values.push(updates.points); }
        if (updates.streakDaily !== undefined) { fields.push(`streak_daily = $${i++}`); values.push(updates.streakDaily); }
        if (updates.streakWeekly !== undefined) { fields.push(`streak_weekly = $${i++}`); values.push(updates.streakWeekly); }
        if (updates.freeExitsRemaining !== undefined) { fields.push(`free_exits_remaining = $${i++}`); values.push(updates.freeExitsRemaining); }
        if (updates.exitCountToday !== undefined) { fields.push(`exit_count_today = $${i++}`); values.push(updates.exitCountToday); }
        if (updates.comprehensionBaseline !== undefined) { fields.push(`comprehension_baseline = $${i++}`); values.push(updates.comprehensionBaseline); }
        if (updates.baselineCompleted !== undefined) { fields.push(`baseline_completed = $${i++}`); values.push(updates.baselineCompleted); }

        if (fields.length > 0) {
          values.push(id);
          await pgPool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`, values);
        }
      } catch (err) {
        console.warn('PostgreSQL update user sync:', err.message);
      }
    }

    return users[idx];
  }

  // ==================== POINTS & LEDGER ====================
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

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO points_ledger (id, user_id, amount, action_type, description, balance_after)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [entry.id, userId, pointsDelta, action, description || action, newPoints]
        );
      } catch (err) {
        console.warn('PostgreSQL ledger sync:', err.message);
      }
    }

    return { user: { ...user, points: newPoints }, entry };
  }

  static async getPointsLedger(userId) {
    if (isPostgresConnected && pgPool) {
      try {
        let q = 'SELECT * FROM points_ledger';
        const vals = [];
        if (userId) {
          q += ' WHERE user_id = $1';
          vals.push(userId);
        }
        q += ' ORDER BY created_at DESC';
        const { rows } = await pgPool.query(q, vals);
        if (rows.length > 0) {
          return rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            amount: r.amount,
            pointsDelta: r.amount,
            action: r.action_type,
            description: r.description,
            balanceAfter: r.balance_after,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('PostgreSQL points ledger fallback:', err.message);
      }
    }
    const ledger = jsonDb.getCollection('pointsLedger');
    if (userId) {
      return ledger.filter(l => l.userId === userId);
    }
    return ledger;
  }

  // ==================== ASSESSMENT RESULTS ====================
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

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO assessment_results (id, user_id, topic, video_id, write_up, rubric_scores, total_score, normalized_score, reference_concepts, feedback)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            item.id, item.userId, item.topic, item.videoId, item.writeUp,
            JSON.stringify(item.rubricScores), item.totalScore, item.normalizedScore,
            item.referenceConcepts, item.feedback
          ]
        );
      } catch (err) {
        console.warn('PostgreSQL assessment sync:', err.message);
      }
    }

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

  // ==================== ROADMAPS ====================
  static async getRoadmap(userId, track, topic) {
    const roadmaps = jsonDb.getCollection('roadmaps');
    return roadmaps.find(r => r.userId === userId && r.track === track && (!topic || r.topic === topic));
  }

  static async saveRoadmap(userId, track, topic, roadmap) {
    const roadmaps = jsonDb.getCollection('roadmaps');
    const existingIdx = roadmaps.findIndex(r => r.userId === userId && r.track === track);
    const item = {
      id: `rm_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      track,
      topic,
      title: roadmap.title,
      stages: roadmap.stages,
      completedModules: [],
      progressPercent: 0,
      updatedAt: new Date().toISOString()
    };
    if (existingIdx !== -1) {
      roadmaps[existingIdx] = { ...roadmaps[existingIdx], ...item };
    } else {
      roadmaps.push(item);
    }
    jsonDb.save();
    return item;
  }

  static async markModuleComplete(userId, track, stageId, moduleId) {
    const roadmaps = jsonDb.getCollection('roadmaps');
    const roadmap = roadmaps.find(r => r.userId === userId && r.track === track);
    if (!roadmap) return null;

    if (!roadmap.completedModules) roadmap.completedModules = [];
    if (!roadmap.completedModules.includes(moduleId)) {
      roadmap.completedModules.push(moduleId);
    }

    let totalMods = 0;
    roadmap.stages?.forEach(st => {
      st.modules?.forEach(mod => {
        totalMods++;
        if (mod.moduleId === moduleId) {
          mod.status = 'completed';
        }
      });
    });

    roadmap.progressPercent = totalMods > 0 ? Math.round((roadmap.completedModules.length / totalMods) * 100) : 0;
    jsonDb.save();
    return roadmap;
  }

  // ==================== ASSIGNMENTS ====================
  static async saveAssignment(data) {
    const assignments = jsonDb.getCollection('assignments');
    const item = {
      id: data.id || `assign_${crypto.randomUUID().slice(0, 8)}`,
      userId: data.userId,
      moduleId: data.moduleId,
      topic: data.topic,
      prompt: data.prompt,
      studentSubmission: data.studentSubmission,
      referenceConcepts: data.referenceConcepts || [],
      rubricScores: data.rubricScores,
      hiddenMarks: data.hiddenMarks,
      createdAt: new Date().toISOString()
    };
    assignments.push(item);
    jsonDb.save();

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO assignments (id, user_id, module_id, topic, prompt, student_submission, reference_concepts, rubric_scores, hidden_marks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            item.id, item.userId, item.moduleId, item.topic, item.prompt,
            item.studentSubmission, item.referenceConcepts, JSON.stringify(item.rubricScores),
            item.hiddenMarks
          ]
        );
      } catch (err) {
        console.warn('PostgreSQL assignment sync:', err.message);
      }
    }

    return item;
  }

  static async getAssignments(userId) {
    const assignments = jsonDb.getCollection('assignments');
    return userId ? assignments.filter(a => a.userId === userId) : assignments;
  }

  // ==================== DSA PROBLEMS & PROGRESS ====================
  static async getDsaProblems() {
    return jsonDb.getCollection('dsaProblems');
  }

  static async addDsaProblems(problemsArray) {
    const current = jsonDb.getCollection('dsaProblems');
    current.push(...problemsArray);
    jsonDb.save();
    return current;
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

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO dsa_progress (id, user_id, problem_id, difficulty, source_sheet, points_earned)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [record.id, userId, problemId, difficulty, record.sourceSheet, pointsEarned]
        );
      } catch (err) {
        console.warn('PostgreSQL dsa solve sync:', err.message);
      }
    }

    return record;
  }

  // ==================== PEER SESSIONS ====================
  static async createPeerSession(data) {
    const sessions = jsonDb.getCollection('peerSessions');
    const sessionId = `peer_${crypto.randomUUID().slice(0, 8)}`;
    // Always use valid Google Meet URL
    const meetUrl = data.meetUrl || Repository.generateGoogleMeetUrl();
    const session = {
      id: sessionId,
      helpeeId: data.helpeeId,
      helpeeName: data.helpeeName,
      helperId: data.helperId,
      helperName: data.helperName,
      topic: data.topic,
      meetUrl,
      meetCode: meetUrl.includes('meet.google.com/') ? meetUrl.replace('https://meet.google.com/', '') : 'new',
      status: 'requested',
      helperPointsAwarded: 0,
      remediationScoreBefore: data.remediationScoreBefore || 45,
      remediationScoreAfter: null,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };
    sessions.unshift(session);
    jsonDb.save();

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO peer_sessions (id, helpee_id, helpee_name, helper_id, helper_name, topic, status, meet_url, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [session.id, session.helpeeId, session.helpeeName, session.helperId, session.helperName, session.topic, session.status, session.meetUrl, session.notes]
        );
      } catch (err) {
        console.warn('PostgreSQL peer session sync:', err.message);
      }
    }

    return session;
  }

  static async getPeerSessions(userId) {
    const sessions = jsonDb.getCollection('peerSessions');
    sessions.forEach(s => {
      // Clean any old broken URLs
      if (!s.meetUrl || (!s.meetUrl.startsWith('https://meet.google.com/') && !s.meetUrl.startsWith('http'))) {
        s.meetUrl = 'https://meet.google.com/new';
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
    const meetUrl = updates.meetUrl || existing.meetUrl || 'https://meet.google.com/new';
    sessions[idx] = {
      ...existing,
      ...updates,
      meetUrl,
      meetCode: meetUrl.includes('meet.google.com/') ? meetUrl.replace('https://meet.google.com/', '') : 'new',
      updatedAt: new Date().toISOString()
    };
    jsonDb.save();

    if (isPostgresConnected && pgPool) {
      try {
        await pgPool.query(
          `UPDATE peer_sessions SET status = $1, meet_url = $2, helper_points_awarded = $3 WHERE id = $4`,
          [sessions[idx].status, meetUrl, sessions[idx].helperPointsAwarded || 0, sessionId]
        );
      } catch (err) {
        console.warn('PostgreSQL update peer session sync:', err.message);
      }
    }

    return sessions[idx];
  }
}
