import { PRESET_TOPIC_REFERENCES, RUBRIC_DIMENSIONS } from '../config/rubricConfig.js';

// Cache for topic reference lists (scoped AI generation, generated once and reused)
const topicReferenceCache = new Map(
  Object.entries(PRESET_TOPIC_REFERENCES).map(([k, v]) => [k, v.expectedConcepts])
);

export class AIService {
  /**
   * Generates or retrieves a scoped 3-6 reference concept list for a topic
   */
  static async getReferenceConcepts(topicName) {
    const key = topicName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (topicReferenceCache.has(key)) {
      return topicReferenceCache.get(key);
    }

    // Check if there's a loose match
    for (const [presetKey, preset] of Object.entries(PRESET_TOPIC_REFERENCES)) {
      if (topicName.toLowerCase().includes(presetKey) || preset.topic.toLowerCase().includes(topicName.toLowerCase())) {
        topicReferenceCache.set(key, preset.expectedConcepts);
        return preset.expectedConcepts;
      }
    }

    // If Gemini or OpenAI API key is present in environment, generate via LLM
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a curriculum expert for technical placement prep.
Generate exactly 4 to 5 concise key technical concepts or terminology points for the topic: "${topicName}".
Return ONLY a valid JSON array of strings, e.g. ["Concept 1", "Concept 2", "Concept 3", "Concept 4"].`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            topicReferenceCache.set(key, parsed);
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Gemini API call failed for reference concepts, falling back to smart extractor:', e.message);
      }
    }

    // Dynamic fallback generation
    const fallbackList = [
      `Fundamental architecture and primary purpose of ${topicName}`,
      `Key operational principles, internal mechanics, and state transitions`,
      `Core terminology, data structures, and algorithmic invariants`,
      `Time/space complexity trade-offs and edge case handling`,
      `Practical placement interview application and system failure modes`
    ];
    topicReferenceCache.set(key, fallbackList);
    return fallbackList;
  }

  /**
   * Evaluates student write-up strictly against the 4 fixed rubric dimensions (0-3 each)
   * using the scoped reference concepts
   */
  static async gradeWriteUp({ topic, writeUp, referenceConcepts }) {
    if (!referenceConcepts || referenceConcepts.length === 0) {
      referenceConcepts = await this.getReferenceConcepts(topic);
    }

    const text = (writeUp || '').trim();
    if (text.length < 15) {
      return {
        rubricScores: {
          coreConceptAccuracy: 0,
          keyTermsUsed: 0,
          depth: 0,
          clarityCoherence: 0
        },
        totalScore: 0,
        normalizedScore: 0,
        referenceConcepts,
        feedback: 'Submission is too brief to evaluate comprehension. Please write at least 2-3 full sentences articulating what you learned.'
      };
    }

    // If Gemini API is available, perform matching via prompt
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a strict technical placement grader.
Topic: "${topic}"
Reference Key Concepts:
${referenceConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Student Write-up:
"""${text}"""

Grade the student write-up strictly according to this fixed 4-dimension rubric (score each dimension 0, 1, 2, or 3):
1. coreConceptAccuracy (0-3): Does the write-up correctly state the main idea?
2. keyTermsUsed (0-3): Does it use core technical vocabulary properly in context?
3. depth (0-3): Does it go beyond a 1-line definition with cause/effect, examples, or mechanics?
4. clarityCoherence (0-3): Is the explanation understandable, logically ordered, and articulate?

Return ONLY valid JSON with keys:
{
  "coreConceptAccuracy": <0-3>,
  "keyTermsUsed": <0-3>,
  "depth": <0-3>,
  "clarityCoherence": <0-3>,
  "feedback": "<2 sentence encouraging constructive feedback mentioning specific concepts>"
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const resText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (resText) {
          const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          const cAcc = Math.min(3, Math.max(0, parseInt(parsed.coreConceptAccuracy) || 0));
          const kTerms = Math.min(3, Math.max(0, parseInt(parsed.keyTermsUsed) || 0));
          const depth = Math.min(3, Math.max(0, parseInt(parsed.depth) || 0));
          const clarity = Math.min(3, Math.max(0, parseInt(parsed.clarityCoherence) || 0));
          const total = cAcc + kTerms + depth + clarity;
          const normalized = Math.round((total / 12) * 100);

          return {
            rubricScores: {
              coreConceptAccuracy: cAcc,
              keyTermsUsed: kTerms,
              depth: depth,
              clarityCoherence: clarity
            },
            totalScore: total,
            normalizedScore: normalized,
            referenceConcepts,
            feedback: parsed.feedback || 'Good synthesis of the foundational concepts.'
          };
        }
      } catch (e) {
        console.warn('Gemini grading error, switching to deterministic rubric evaluator:', e.message);
      }
    }

    // High precision NLP Concept-Matching Engine (Matches student text vs reference concepts)
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).filter(w => w.length > 2);
    
    // Extract keywords from reference concepts
    let matchedConceptCount = 0;
    const termsMatched = [];

    for (const concept of referenceConcepts) {
      const conceptWords = concept.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/)
        .filter(w => !['and', 'the', 'for', 'with', 'using', 'such', 'versus', 'divided', 'such'].includes(w) && w.length > 3);
      
      const hasMatch = conceptWords.some(cw => lowerText.includes(cw));
      if (hasMatch) {
        matchedConceptCount++;
        termsMatched.push(concept);
      }
    }

    const wordCount = words.length;

    // Dimension 1: Core Concept Accuracy (0-3)
    let coreConceptAccuracy = 1;
    if (matchedConceptCount >= 3) coreConceptAccuracy = 3;
    else if (matchedConceptCount >= 1) coreConceptAccuracy = 2;
    else if (wordCount > 25) coreConceptAccuracy = 1;
    else coreConceptAccuracy = 0;

    // Dimension 2: Key Terms Used Correctly (0-3)
    let keyTermsUsed = 0;
    if (matchedConceptCount >= 4) keyTermsUsed = 3;
    else if (matchedConceptCount >= 2) keyTermsUsed = 2;
    else if (matchedConceptCount === 1) keyTermsUsed = 1;

    // Dimension 3: Depth (0-3)
    let depth = 0;
    if (wordCount >= 65 && matchedConceptCount >= 2) depth = 3;
    else if (wordCount >= 35 && matchedConceptCount >= 1) depth = 2;
    else if (wordCount >= 18) depth = 1;

    // Dimension 4: Clarity & Coherence (0-3)
    let clarityCoherence = 2;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3 && wordCount >= 30) clarityCoherence = 3;
    else if (sentences.length >= 1 && wordCount >= 15) clarityCoherence = 2;
    else clarityCoherence = 1;

    const totalScore = coreConceptAccuracy + keyTermsUsed + depth + clarityCoherence;
    const normalizedScore = Math.round((totalScore / 12) * 100);

    const feedback = normalizedScore >= 75
      ? `Strong comprehension! You captured ${matchedConceptCount} out of ${referenceConcepts.length} core concepts accurately with good technical depth.`
      : normalizedScore >= 50
      ? `Solid initial grasp. You identified key ideas (${matchedConceptCount} matched), but expand further on specific trade-offs and underlying mechanisms.`
      : `Needs reinforcement. Your response touched briefly on the topic, but missed several core architectural terms. Recommended for remediation review.`;

    return {
      rubricScores: {
        coreConceptAccuracy,
        keyTermsUsed,
        depth,
        clarityCoherence
      },
      totalScore,
      normalizedScore,
      referenceConcepts,
      feedback
    };
  }

  /**
   * Generates a personalized roadmap for a track and topic
   */
  static generateRoadmap(track, topic, studentProfile = {}) {
    const interest = topic || studentProfile.interestArea || 'Data Structures & Algorithms';

    // Tailored roadmap structures
    if (track === 'aptitude') {
      return {
        track: 'aptitude',
        topic: interest,
        title: 'Quantitative & Logical Reasoning Sprint',
        stages: [
          {
            stageId: 'apt_stage_1',
            title: 'Arithmetic Foundations & Speed Math',
            order: 1,
            modules: [
              {
                moduleId: 'mod_apt_1',
                title: 'Percentages, Profit & Loss Shortcuts',
                type: 'video',
                status: 'unlocked',
                duration: '12 min',
                videoUrl: 'https://www.youtube.com/embed/HQnzY_i8R1o',
                summary: 'Core percentage formulas and ratio conversions used in campus placement tests.'
              },
              {
                moduleId: 'mod_apt_2',
                title: 'Ratio, Proportion & Variation Flashcards',
                type: 'flashcard',
                status: 'unlocked',
                flashcards: [
                  { id: 'f1', question: 'What is the compound ratio of a:b and c:d?', answer: 'ac : bd' },
                  { id: 'f2', question: 'If A:B = 2:3 and B:C = 4:5, what is A:B:C?', answer: '8 : 12 : 15 (multiply top by 4, bottom by 3)' },
                  { id: 'f3', question: 'Formula for finding duplicate ratio of a:b?', answer: 'a² : b²' }
                ]
              },
              {
                moduleId: 'mod_apt_3',
                title: 'Check: Basic Number Theory',
                type: 'prerequisite',
                status: 'unlocked',
                prerequisiteTopic: 'Divisibility rules & prime factorization check'
              }
            ]
          },
          {
            stageId: 'apt_stage_2',
            title: 'Combinatorics & Probability Mastery',
            order: 2,
            modules: [
              {
                moduleId: 'mod_apt_4',
                title: 'Permutations vs Combinations Visualized',
                type: 'video',
                status: 'unlocked',
                duration: '14 min',
                videoUrl: 'https://www.youtube.com/embed/XqQTXW7XfNY',
                summary: 'Learn when order matters (nPr) vs when only selection matters (nCr).'
              },
              {
                moduleId: 'mod_apt_5',
                title: 'Conditional Probability & Dice/Cards Flashcards',
                type: 'flashcard',
                status: 'unlocked',
                flashcards: [
                  { id: 'f4', question: 'Formula for P(A | B)?', answer: 'P(A ∩ B) / P(B)' },
                  { id: 'f5', question: 'Independent events definition', answer: 'P(A ∩ B) = P(A) * P(B)' }
                ]
              }
            ]
          }
        ]
      };
    }

    if (track === 'projects') {
      return {
        track: 'projects',
        topic: 'Full-Stack Campus Placement System',
        title: 'Industry-Grade Project Track',
        stages: [
          {
            stageId: 'proj_stage_1',
            title: 'Architecture & System Design Specs',
            order: 1,
            modules: [
              {
                moduleId: 'mod_proj_1',
                title: 'Project Architecture: High Level Design',
                type: 'project',
                status: 'unlocked',
                projectDetails: {
                  name: 'AI Resume Matcher & Mock Assessment Platform',
                  specs: 'Design a microservice backend that digests candidate resumes, extracts skill vectors, and benchmarks candidate match against job descriptions.',
                  milestones: [
                    'Milestone 1: Design Entity-Relationship diagram for Students, Jobs, and Applications',
                    'Milestone 2: Implement JWT-authenticated REST APIs for job postings and candidate submission',
                    'Milestone 3: Integrate LLM scoring endpoint with fixed rubric metrics',
                    'Milestone 4: Build React dashboard with real-time application status tracker'
                  ]
                }
              }
            ]
          },
          {
            stageId: 'proj_stage_2',
            title: 'API Implementation & Verification',
            order: 2,
            modules: [
              {
                moduleId: 'mod_proj_2',
                title: 'Database Indexing & Caching Layer',
                type: 'project',
                status: 'unlocked',
                projectDetails: {
                  name: 'Redis Cache & Query Optimization',
                  specs: 'Add Redis cache layer for high-throughput job listing queries and measure latency drop.',
                  milestones: [
                    'Configure Redis client with cache-aside pattern',
                    'Implement TTL expiration on leaderboard and job query keys',
                    'Benchmark response times before and after caching using Autocannon'
                  ]
                }
              }
            ]
          }
        ]
      };
    }

    if (track === 'cs_fundamentals') {
      return {
        track: 'cs_fundamentals',
        topic: interest || 'Operating Systems & DBMS',
        title: 'Core CS Foundations for Tier-1 Companies',
        stages: [
          {
            stageId: 'cs_stage_1',
            title: 'Operating Systems & Concurrency',
            order: 1,
            modules: [
              {
                moduleId: 'mod_cs_1',
                title: 'Process vs Threads & Context Switching',
                type: 'video',
                status: 'unlocked',
                duration: '11 min',
                videoUrl: 'https://www.youtube.com/embed/4rLW7ZG27gI',
                summary: 'Memory spaces, PCB, TCB, CPU registers, and context switch costs.'
              },
              {
                moduleId: 'mod_cs_2',
                title: 'Synchronization & Deadlocks Flashcards',
                type: 'flashcard',
                status: 'unlocked',
                flashcards: [
                  { id: 'fc_cs1', question: 'What are Coffman\'s four deadlock conditions?', answer: '1. Mutual Exclusion\n2. Hold & Wait\n3. No Preemption\n4. Circular Wait' },
                  { id: 'fc_cs2', question: 'Difference between Mutex and Semaphore?', answer: 'Mutex is a locking mechanism owned by 1 thread. Semaphore is a signaling mechanism (counting/binary) accessible by any thread.' },
                  { id: 'fc_cs3', question: 'What causes Thrashing in virtual memory?', answer: 'When the CPU spends more time swapping pages in/out of swap space than executing instructions due to excessive page faults.' }
                ]
              }
            ]
          },
          {
            stageId: 'cs_stage_2',
            title: 'DBMS Internals & Indexing',
            order: 2,
            modules: [
              {
                moduleId: 'mod_cs_3',
                title: 'B+ Trees vs B-Trees in Disk Storage',
                type: 'video',
                status: 'unlocked',
                duration: '15 min',
                videoUrl: 'https://www.youtube.com/embed/aZjYr87r1b8',
                summary: 'Why databases use B+ Trees for range queries and sequential block reads.'
              },
              {
                moduleId: 'mod_cs_4',
                title: 'ACID & Isolation Anomalies',
                type: 'flashcard',
                status: 'unlocked',
                flashcards: [
                  { id: 'fc_db1', question: 'What is a Dirty Read anomaly?', answer: 'Reading uncommitted data modified by another concurrent transaction that later rolls back.' },
                  { id: 'fc_db2', question: 'What is a Phantom Read?', answer: 'A transaction re-executes a query with a range condition and finds new rows inserted by another committed transaction.' }
                ]
              }
            ]
          }
        ]
      };
    }

    // Default: Data Structures & Algorithms
    return {
      track: 'dsa',
      topic: interest || 'Binary Search Trees & Graphs',
      title: 'DSA Placement Preparation Blueprint',
      stages: [
        {
          stageId: 'dsa_stage_1',
          title: 'Stage 1: Trees & Hierarchical Structures',
          order: 1,
          modules: [
            {
              moduleId: 'mod_dsa_1',
              title: 'Binary Search Tree Balancing & Rotations',
              type: 'video',
              status: 'unlocked',
              duration: '13 min',
              videoUrl: 'https://www.youtube.com/embed/vRwi_UcZGjU',
              summary: 'AVL rotations (LL, RR, LR, RL) and preserving the BST invariant.'
            },
            {
              moduleId: 'mod_dsa_2',
              title: 'Tree Traversals & BST Properties Flashcards',
              type: 'flashcard',
              status: 'unlocked',
              flashcards: [
                { id: 'fc_dsa1', question: 'Which traversal yields sorted sequence for a BST?', answer: 'In-order traversal (Left, Root, Right)' },
                { id: 'fc_dsa2', question: 'Worst case time complexity to search in unbalanced BST?', answer: 'O(N) when the tree degenerates into a linked list' },
                { id: 'fc_dsa3', question: 'Height balancing condition for an AVL tree?', answer: 'Balance factor |Height(Left) - Height(Right)| <= 1 for every node' }
              ]
            },
            {
              moduleId: 'mod_dsa_3',
              title: 'Prerequisite Pointer: Recursion Call Stack',
              type: 'prerequisite',
              status: 'unlocked',
              prerequisiteTopic: 'Recursion trees, stack frames, and base cases'
            }
          ]
        },
        {
          stageId: 'dsa_stage_2',
          title: 'Stage 2: Graph Traversals & Shortest Paths',
          order: 2,
          modules: [
            {
              moduleId: 'mod_dsa_4',
              title: 'BFS vs DFS with Cycle Detection',
              type: 'video',
              status: 'unlocked',
              duration: '16 min',
              videoUrl: 'https://www.youtube.com/embed/pcKY4hjDrxk',
              summary: 'Queue-based level-order search vs stack-based depth traversal.'
            },
            {
              moduleId: 'mod_dsa_5',
              title: 'Dijkstra & Topological Sort Flashcards',
              type: 'flashcard',
              status: 'unlocked',
              flashcards: [
                { id: 'fc_g1', question: 'Can Dijkstra\'s algorithm handle negative edge weights?', answer: 'No! Dijkstra fails on negative weights because greedy choice cannot backtrack. Use Bellman-Ford instead.' },
                { id: 'fc_g2', question: 'What graph property is required for Topological Sort?', answer: 'The graph must be a Directed Acyclic Graph (DAG).' }
              ]
            }
          ]
        },
        {
          stageId: 'dsa_stage_3',
          title: 'Stage 3: Dynamic Programming Patterns',
          order: 3,
          modules: [
            {
              moduleId: 'mod_dsa_6',
              title: '0/1 Knapsack & Memoization Blueprint',
              type: 'video',
              status: 'unlocked',
              duration: '18 min',
              videoUrl: 'https://www.youtube.com/embed/nLmhmB6NzcM',
              summary: 'Transitioning from recursive decision tree to bottom-up DP table.'
            }
          ]
        }
      ]
    };
  }

  /**
   * Formative interpretation check (Visual/Concept without explanation)
   */
  static evaluateInterpretation(conceptVisualId, studentText) {
    const checks = {
      'tree_rotation': {
        name: 'AVL Tree Right Rotation (RR)',
        expectedCore: 'Right rotation performed on node when left subtree height exceeds right by > 1. Child becomes new root, old root becomes right child.',
        keyKeywords: ['rotation', 'height', 'balance', 'root', 'left', 'right', 'avl']
      },
      'overfitting_curve': {
        name: 'Model Overfitting vs Underfitting Curve',
        expectedCore: 'Training loss continues dropping while validation loss starts rising, indicating the model is memorizing noise and failing to generalize.',
        keyKeywords: ['training', 'validation', 'loss', 'generalize', 'overfitting', 'noise', 'variance']
      },
      'tcp_handshake': {
        name: 'TCP 3-Way Handshake Sequence',
        expectedCore: 'SYN sent by client, SYN-ACK acknowledged by server, ACK sent back to establish reliable connection with synchronized sequence numbers.',
        keyKeywords: ['syn', 'ack', 'client', 'server', 'sequence', 'connection', 'handshake']
      },
      'sliding_window': {
        name: 'Sliding Window Algorithm Visualization',
        expectedCore: 'Two pointers expanding the right boundary and contracting the left boundary to maintain a valid subarray constraint in O(N) time.',
        keyKeywords: ['window', 'pointer', 'left', 'right', 'expand', 'shrink', 'linear', 'subarray']
      }
    };

    const target = checks[conceptVisualId] || checks['tree_rotation'];
    const text = (studentText || '').toLowerCase();
    const matched = target.keyKeywords.filter(k => text.includes(k));
    const accuracyPercent = Math.min(100, Math.round((matched.length / Math.min(4, target.keyKeywords.length)) * 100));

    return {
      conceptName: target.name,
      accuracyPercent,
      matchedTerms: matched,
      expectedCore: target.expectedCore,
      instantFeedback: accuracyPercent >= 65
        ? `Great intuition! You correctly recognized ${matched.join(', ')} and accurately described the structural behavior.`
        : `Partial interpretation. You noted ${matched.join(', ') || 'some aspects'}, but observe the key mechanism: ${target.expectedCore}`
    };
  }
}
