import express from 'express';
import { AIService } from '../services/aiService.js';
import { Repository } from '../models/repository.js';

const router = express.Router();

// Formative Interpretation-Check (ungraded real-time concept check)
router.post('/interpretation-check', async (req, res) => {
  try {
    const { visualId, studentInterpretation } = req.body;
    if (!studentInterpretation) {
      return res.status(400).json({ error: 'Interpretation text is required' });
    }

    const evaluation = AIService.evaluateInterpretation(visualId, studentInterpretation);
    res.json({
      success: true,
      evaluation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Module Assignment Submission
// Graded with fixed 4-dimension rubric + scoped reference concepts
// Marks are HIDDEN from the student and stored in MongoDB profile
router.post('/assignment-submit', async (req, res) => {
  try {
    const { userId, moduleId, topic, prompt, studentSubmission } = req.body;
    if (!studentSubmission || studentSubmission.trim().length === 0) {
      return res.status(400).json({ error: 'Submission text is required' });
    }

    const currentTopic = topic || 'Data Structures & Algorithms';
    const referenceConcepts = await AIService.getReferenceConcepts(currentTopic);

    // AI grading against fixed 4 dimensions
    const grading = await AIService.gradeWriteUp({
      topic: currentTopic,
      writeUp: studentSubmission,
      referenceConcepts
    });

    // Save with HIDDEN marks in MongoDB
    const assignmentRecord = await Repository.saveAssignment({
      userId,
      moduleId: moduleId || 'mod_general',
      topic: currentTopic,
      prompt: prompt || 'Explain the internal mechanics and asymptotic behavior.',
      studentSubmission,
      referenceConcepts,
      rubricScores: grading.rubricScores,
      hiddenMarks: grading.normalizedScore // Hidden from student!
    });

    // We do NOT return the numeric marks to the student
    res.json({
      success: true,
      message: 'Assignment submitted and recorded to your learning profile for continuous assessment.',
      moduleId,
      topic: currentTopic,
      struggleDetected: grading.normalizedScore < 60
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Struggling Detection & Remediation Routing
router.get('/remediation/:userId/:topic', async (req, res) => {
  try {
    const { userId, topic } = req.params;
    const user = await Repository.getUserById(userId);
    const assignments = await Repository.getAssignments(userId);
    
    // Check if struggling on this topic
    const topicAssignments = assignments.filter(a =>
      a.topic?.toLowerCase().includes(topic.toLowerCase()) ||
      topic.toLowerCase().includes(a.topic?.toLowerCase())
    );

    const latestAssignment = topicAssignments[topicAssignments.length - 1];
    const baseline = user?.topicProficiencies?.[topic] ?? user?.comprehensionBaseline ?? 70;
    
    // Struggling if baseline < 60 or last assignment hidden marks < 60
    const isStruggling = (latestAssignment && latestAssignment.hiddenMarks < 60) || baseline < 60;

    // Alternate format content for remediation
    const alternateFormat = {
      title: `Remediation Deep-Dive: ${topic.replace(/_/g, ' ')}`,
      mode: 'Visual Cheat-Sheet & Step-by-Step Breakdown',
      content: `Let's break this down differently. Instead of abstract math, think of ${topic} as an organized system.`,
      keyTakeaways: [
        'Core Invariant: State changes follow strict boundary conditions.',
        'Visual Step 1: Trace small inputs by hand before formulating asymptotic proofs.',
        'Visual Step 2: Identify edge cases (empty states, single nodes, duplicates).'
      ],
      diagramUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
    };

    // Find peer mentors with demonstrated strength in this topic (>80%)
    const allUsers = await Repository.getUsers();
    const mentors = allUsers
      .filter(u => u.id !== userId && (u.topicProficiencies?.[topic] >= 80 || u.comprehensionBaseline >= 85 || u.role === 'peer_mentor'))
      .map(u => ({
        id: u.id,
        name: u.name,
        college: u.college,
        proficiencyScore: u.topicProficiencies?.[topic] || u.comprehensionBaseline || 90,
        avatar: u.avatar
      }))
      .slice(0, 3);

    res.json({
      topic,
      isStruggling,
      remediation: {
        alternateFormat,
        matchedMentors: mentors
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
