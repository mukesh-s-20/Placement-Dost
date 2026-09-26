export const RUBRIC_DIMENSIONS = [
  {
    id: 'coreConceptAccuracy',
    name: 'Core Concept Accuracy',
    description: 'Does the write-up correctly state the main idea of the topic?',
    scale: {
      0: 'No understanding or completely incorrect core concept',
      1: 'Vague or partially flawed understanding of core premise',
      2: 'Substantially accurate explanation of main principles',
      3: 'Flawless, precise formulation of the primary concept'
    }
  },
  {
    id: 'keyTermsUsed',
    name: 'Key Terms Used Correctly',
    description: 'Does it use the topic\'s core vocabulary appropriately in proper context?',
    scale: {
      0: 'None or completely misused technical terms',
      1: 'Mentions 1 key term superficially or without context',
      2: 'Accurately weaves 2-3 relevant terms in correct technical context',
      3: 'Natural, comprehensive command of domain vocabulary (4+ terms)'
    }
  },
  {
    id: 'depth',
    name: 'Depth & Elaboration',
    description: 'Does it go beyond a one-line definition (examples, cause/effect, trade-offs)?',
    scale: {
      0: 'Minimal or one-sentence regurgitation without detail',
      1: 'Brief definition with minimal elaboration',
      2: 'Solid breakdown including an example, mechanism, or cause/effect',
      3: 'Deep synthesis connecting to trade-offs, architecture, or edge cases'
    }
  },
  {
    id: 'clarityCoherence',
    name: 'Clarity & Coherence',
    description: 'Is the explanation understandable, logically ordered, and articulate?',
    scale: {
      0: 'Incoherent, fragmented, or confusing train of thought',
      1: 'Hard to follow, loose connection between points',
      2: 'Clear, structured explanation with understandable flow',
      3: 'Exemplary pedagogical clarity, structured logically'
    }
  }
];

// Pre-curated reference concept terms by topic for instant scoped AI grading matching
export const PRESET_TOPIC_REFERENCES = {
  'ml_basics': {
    topic: 'Machine Learning Basics',
    expectedConcepts: [
      'Supervised vs Unsupervised learning',
      'Training data vs Test data and ground truth labels',
      'Features, targets, and loss function minimization',
      'Model generalization vs Overfitting / Underfitting',
      'Evaluation metrics such as accuracy, precision, and recall'
    ]
  },
  'binary_search_trees': {
    topic: 'Binary Search Trees & Balancing',
    expectedConcepts: [
      'BST property: Left child < Node < Right child',
      'In-order traversal yielding sorted order',
      'Time complexity: O(log N) average vs O(N) skewed worst case',
      'Self-balancing trees (AVL / Red-Black) using tree rotations',
      'Height balancing factor and search optimization'
    ]
  },
  'graph_algorithms': {
    topic: 'Graph Algorithms & Traversals',
    expectedConcepts: [
      'Adjacency list vs Adjacency matrix representations',
      'BFS using queue for shortest unweighted path',
      'DFS using stack/recursion for cycle detection and topological sort',
      'Dijkstra priority queue greedy pathfinding with non-negative weights',
      'Time complexity O(V + E) for standard traversals'
    ]
  },
  'operating_systems': {
    topic: 'Operating Systems & Concurrency',
    expectedConcepts: [
      'Process vs Thread memory space and context switching overhead',
      'CPU scheduling algorithms (Round Robin, FCFS, Priority)',
      'Concurrency issues: Race conditions, critical sections, and mutual exclusion',
      'Deadlock four conditions (Mutual exclusion, Hold & wait, No preemption, Circular wait)',
      'Virtual memory, paging, page faults, and TLB cache'
    ]
  },
  'database_internals': {
    topic: 'Database Internals & Indexing',
    expectedConcepts: [
      'B-Tree and B+ Tree indexing mechanics and disk page I/O',
      'ACID properties (Atomicity, Consistency, Isolation, Durability)',
      'Transaction isolation levels and dirty read / phantom read anomalies',
      'Clustered vs Non-clustered secondary indexes',
      'Query execution plans and table scan vs index seek trade-offs'
    ]
  },
  'system_design': {
    topic: 'System Design & Scalability',
    expectedConcepts: [
      'Horizontal vs Vertical scaling and load balancing algorithms',
      'Caching layers (Redis, Memcached) and cache invalidation strategies',
      'Database sharding, read replicas, and replication lag',
      'CAP theorem (Consistency, Availability, Partition Tolerance)',
      'Asynchronous processing with message queues (Kafka, RabbitMQ)'
    ]
  },
  'aptitude_probability': {
    topic: 'Probability & Combinatorics for Placements',
    expectedConcepts: [
      'Permutations vs Combinations (order matters vs grouping)',
      'Independent events vs Conditional probability (Bayes theorem)',
      'Favorable outcomes divided by total sample space',
      'Complementary probability (1 - P(none))',
      'Expected value and discrete probability distribution'
    ]
  }
};
