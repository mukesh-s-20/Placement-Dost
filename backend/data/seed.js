import { jsonDb } from '../config/db.js';

export const seedDatabase = async () => {
  const users = jsonDb.getCollection('users');
  const dsaProblems = jsonDb.getCollection('dsaProblems');
  const peerSessions = jsonDb.getCollection('peerSessions');
  const pointsLedger = jsonDb.getCollection('pointsLedger');

  // Seed users if empty or only 1
  if (users.length <= 1) {
    const demoUsers = [
      {
        id: 'usr_rohan',
        _id: 'usr_rohan',
        name: 'Rohan Verma',
        email: 'rohan.v@iitm.ac.in',
        college: 'IIT Madras',
        department: 'Computer Science & Engineering',
        interestArea: 'Machine Learning & AI',
        topCareerChoice: 'AI Research Scientist',
        points: 345,
        streakDaily: 14,
        streakWeekly: 4,
        comprehensionBaseline: 94,
        baselineCompleted: true,
        topicProficiencies: {
          'ml_basics': 96,
          'binary_search_trees': 92,
          'operating_systems': 95,
          'graph_algorithms': 90
        },
        role: 'peer_mentor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rohan'
      },
      {
        id: 'usr_aarav',
        _id: 'usr_aarav',
        name: 'Aarav Sharma',
        email: 'aarav.s@citchennai.net',
        college: 'Chennai Institute of Technology',
        department: 'Computer Science & Engineering',
        interestArea: 'Data Structures & Algorithms',
        topCareerChoice: 'SDE (Tier-1)',
        points: 290,
        streakDaily: 11,
        streakWeekly: 3,
        comprehensionBaseline: 88,
        baselineCompleted: true,
        topicProficiencies: {
          'ml_basics': 85,
          'binary_search_trees': 95,
          'database_internals': 88,
          'system_design': 91
        },
        role: 'peer_mentor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=aarav'
      },
      {
        id: 'usr_kavya',
        _id: 'usr_kavya',
        name: 'Kavya Patel',
        email: 'kavya.p@citchennai.net',
        college: 'Chennai Institute of Technology',
        department: 'Artificial Intelligence & Data Science',
        interestArea: 'Machine Learning & AI',
        topCareerChoice: 'Machine Learning Engineer',
        points: 265,
        streakDaily: 9,
        streakWeekly: 2,
        comprehensionBaseline: 91,
        baselineCompleted: true,
        topicProficiencies: {
          'ml_basics': 94,
          'graph_algorithms': 88,
          'aptitude_probability': 92
        },
        role: 'peer_mentor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=kavya'
      },
      {
        id: 'usr_ananya',
        _id: 'usr_ananya',
        name: 'Ananya Iyer',
        email: 'ananya.i@iitm.ac.in',
        college: 'IIT Madras',
        department: 'Information Technology',
        interestArea: 'Full Stack & System Design',
        topCareerChoice: 'Cloud Solutions Architect',
        points: 240,
        streakDaily: 8,
        streakWeekly: 2,
        comprehensionBaseline: 84,
        baselineCompleted: true,
        topicProficiencies: {
          'system_design': 95,
          'database_internals': 92
        },
        role: 'peer_mentor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ananya'
      },
      {
        id: 'usr_deepak',
        _id: 'usr_deepak',
        name: 'Deepak Raj',
        email: 'deepak.r@citchennai.net',
        college: 'Chennai Institute of Technology',
        department: 'Computer Science & Engineering',
        interestArea: 'Data Structures & Algorithms',
        topCareerChoice: 'SDE (Tier-1)',
        points: 215,
        streakDaily: 6,
        streakWeekly: 2,
        comprehensionBaseline: 78,
        baselineCompleted: true,
        topicProficiencies: {
          'binary_search_trees': 85,
          'operating_systems': 82
        },
        role: 'student',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deepak'
      },
      {
        id: 'usr_vikram',
        _id: 'usr_vikram',
        name: 'Vikram Nair',
        email: 'vikram.n@pilani.bits-pilani.ac.in',
        college: 'BITS Pilani',
        department: 'Computer Science',
        interestArea: 'Operating Systems & Networks',
        topCareerChoice: 'Systems Engineer',
        points: 195,
        streakDaily: 5,
        streakWeekly: 1,
        comprehensionBaseline: 82,
        baselineCompleted: true,
        topicProficiencies: {
          'operating_systems': 94,
          'system_design': 87
        },
        role: 'peer_mentor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=vikram'
      },
      {
        id: 'usr_siddharth',
        _id: 'usr_siddharth',
        name: 'Siddharth Menon',
        email: 'siddharth.m@annauniv.edu',
        college: 'Anna University',
        department: 'Information Technology',
        interestArea: 'Aptitude & Logical Reasoning',
        topCareerChoice: 'Quantitative Analyst',
        points: 180,
        streakDaily: 4,
        streakWeekly: 1,
        comprehensionBaseline: 80,
        baselineCompleted: true,
        topicProficiencies: {
          'aptitude_probability': 96
        },
        role: 'peer_mentor',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=siddharth'
      }
    ];

    users.push(...demoUsers);
  }

  // Seed DSA problems
  if (dsaProblems.length === 0) {
    const presetProblems = [
      {
        id: 'dsa_01',
        title: 'Two Sum',
        difficulty: 'Easy',
        topic: 'Arrays & Hashing',
        sourceSheet: 'Striver SDE Sheet',
        url: 'https://leetcode.com/problems/two-sum/',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Use a hash map for O(n) time.',
        examples: 'Input: nums = [2,7,11,15], target = 9 -> Output: [0,1]',
        testCases: [
          { input: 'nums = [2,7,11,15], target = 9', expected: '[0, 1]' },
          { input: 'nums = [3,2,4], target = 6', expected: '[1, 2]' }
        ]
      },
      {
        id: 'dsa_02',
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        topic: 'Linked Lists',
        sourceSheet: 'NeetCode 150',
        url: 'https://leetcode.com/problems/reverse-linked-list/',
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list. Solve iteratively with pointers prev, curr, next in O(1) space.',
        examples: 'Input: head = [1,2,3,4,5] -> Output: [5,4,3,2,1]',
        testCases: [
          { input: 'head = [1,2,3,4,5]', expected: '[5,4,3,2,1]' }
        ]
      },
      {
        id: 'dsa_03',
        title: 'Maximum Subarray (Kadane’s Algorithm)',
        difficulty: 'Medium',
        topic: 'Dynamic Programming / Arrays',
        sourceSheet: 'Striver SDE Sheet',
        url: 'https://leetcode.com/problems/maximum-subarray/',
        description: 'Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum. Maintain running sum and reset when negative.',
        examples: 'Input: nums = [-2,1,-3,4,-1,2,1,-5,4] -> Output: 6 ([4,-1,2,1])',
        testCases: [
          { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expected: '6' }
        ]
      },
      {
        id: 'dsa_04',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        topic: 'Sliding Window',
        sourceSheet: 'Blind 75',
        url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        description: 'Given a string s, find the length of the longest substring without repeating characters using variable size sliding window and hash set.',
        examples: 'Input: s = "abcabcbb" -> Output: 3 ("abc")',
        testCases: [
          { input: 's = "abcabcbb"', expected: '3' },
          { input: 's = "bbbbb"', expected: '1' }
        ]
      },
      {
        id: 'dsa_05',
        title: 'Lowest Common Ancestor of a Binary Search Tree',
        difficulty: 'Medium',
        topic: 'Trees',
        sourceSheet: 'Striver SDE Sheet',
        url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
        description: 'Given a BST, find the lowest common ancestor (LCA) node of two given nodes p and q using BST split property in O(h) time.',
        examples: 'Input: root = [6,2,8,0,4,7,9], p = 2, q = 8 -> Output: 6',
        testCases: [
          { input: 'root = [6,2,8], p = 2, q = 8', expected: '6' }
        ]
      },
      {
        id: 'dsa_06',
        title: 'Merge Intervals',
        difficulty: 'Medium',
        topic: 'Intervals',
        sourceSheet: 'Striver SDE Sheet',
        url: 'https://leetcode.com/problems/merge-intervals/',
        description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals. Sort intervals by start time first.',
        examples: 'Input: intervals = [[1,3],[2,6],[8,10],[15,18]] -> Output: [[1,6],[8,10],[15,18]]',
        testCases: [
          { input: '[[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' }
        ]
      },
      {
        id: 'dsa_07',
        title: 'Word Ladder',
        difficulty: 'Hard',
        topic: 'Graphs & BFS',
        sourceSheet: 'NeetCode 150',
        url: 'https://leetcode.com/problems/word-ladder/',
        description: 'Given two words, beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence. Use BFS level-by-level.',
        examples: 'Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"] -> Output: 5',
        testCases: [
          { input: 'beginWord = "hit", endWord = "cog"', expected: '5' }
        ]
      },
      {
        id: 'dsa_08',
        title: 'Trapping Rain Water',
        difficulty: 'Hard',
        topic: 'Two Pointers',
        sourceSheet: 'Blind 75',
        url: 'https://leetcode.com/problems/trapping-rain-water/',
        description: 'Given n non-negative integers representing an elevation map where width of each bar is 1, compute how much water it can trap after raining.',
        examples: 'Input: height = [0,1,0,2,1,0,1,3,2,1,2,1] -> Output: 6',
        testCases: [
          { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' }
        ]
      }
    ];
    dsaProblems.push(...presetProblems);
  }

  jsonDb.save();
};
