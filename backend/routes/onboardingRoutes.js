import express from 'express';
import { AIService } from '../services/aiService.js';
import { Repository } from '../models/repository.js';
import { PRESET_TOPIC_REFERENCES } from '../config/rubricConfig.js';

const router = express.Router();

// Preset Onboarding Videos catalog mapped by interest area
const ONBOARDING_VIDEOS = {
  'Machine Learning & AI': {
    topic: 'ml_basics',
    title: 'Machine Learning Core Architecture & Generalization',
    duration: '4:15',
    videoUrl: 'https://www.youtube.com/embed/ukzFI9rgwfU',
    description: 'Master supervised vs unsupervised learning, loss functions, overfitting, and evaluation metrics.'
  },
  'Data Structures & Algorithms': {
    topic: 'binary_search_trees',
    title: 'Binary Search Trees, Rotations & Asymptotic Search',
    duration: '5:10',
    videoUrl: 'https://www.youtube.com/embed/8hly31xKli0',
    description: 'Understand BST invariants, height balancing, rotations, and O(log N) operations.'
  },
  'CS Fundamentals': {
    topic: 'operating_systems',
    title: 'Operating Systems: Concurrency, Deadlocks & Virtual Memory',
    duration: '4:45',
    videoUrl: 'https://www.youtube.com/embed/26QPDBe-NB8',
    description: 'Learn process vs thread memory spaces, scheduling algorithms, and deadlock conditions.'
  },
  'Full Stack & System Design': {
    topic: 'system_design',
    title: 'System Design: Scalability, Caching & CAP Theorem',
    duration: '5:00',
    videoUrl: 'https://www.youtube.com/embed/4r6WdaY3SOA',
    description: 'High-availability architecture, caching strategies, load balancing, and database sharding.'
  },
  'Aptitude & Reasoning': {
    topic: 'aptitude_probability',
    title: 'Probability, Combinatorics & Decision Math',
    duration: '4:30',
    videoUrl: 'https://www.youtube.com/embed/XqQTXW7XfNY',
    description: 'Permutations, combinations, independent events, and conditional probability for placements.'
  }
};

// Serve personalized video matching student interest
router.get('/video', (req, res) => {
  const { interestArea } = req.query;
  const match = ONBOARDING_VIDEOS[interestArea] || ONBOARDING_VIDEOS['Machine Learning & AI'];
  res.json({ video: match });
});

// Get reference concepts (scoped AI step, cached and reviewable)
router.get('/reference-concepts', async (req, res) => {
  try {
    const topic = req.query.topic || 'ml_basics';
    const referenceConcepts = await AIService.getReferenceConcepts(topic);
    res.json({ topic, referenceConcepts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Grade recall write-up with fixed 4-dimension rubric
router.post('/grade-writeup', async (req, res) => {
  try {
    const { userId, topic, videoId, writeUp } = req.body;
    if (!writeUp || writeUp.trim().length === 0) {
      return res.status(400).json({ error: 'Write-up content is required' });
    }

    // 1. Get scoped reference concepts
    const referenceConcepts = await AIService.getReferenceConcepts(topic || 'ml_basics');

    // 2. Grade strictly with fixed 4-dimension rubric
    const grading = await AIService.gradeWriteUp({
      topic: topic || 'ml_basics',
      writeUp,
      referenceConcepts
    });

    // 3. Store result to MongoDB profile in AssessmentResults
    let savedRecord = null;
    if (userId) {
      savedRecord = await Repository.saveAssessmentResult({
        userId,
        topic: topic || 'ml_basics',
        videoId: videoId || 'onboarding_v1',
        writeUp,
        rubricScores: grading.rubricScores,
        totalScore: grading.totalScore,
        normalizedScore: grading.normalizedScore,
        referenceConcepts,
        feedback: grading.feedback
      });

      // Award onboarding bonus points
      await Repository.addPoints(
        userId,
        5,
        'ONBOARDING_RECALL_COMPLETE',
        `Completed video recall comprehension check (${grading.normalizedScore}/100 baseline)`
      );
    }

    res.json({
      success: true,
      rubricScores: grading.rubricScores,
      totalScore: grading.totalScore,
      normalizedScore: grading.normalizedScore,
      referenceConcepts,
      feedback: grading.feedback,
      assessmentId: savedRecord?.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
