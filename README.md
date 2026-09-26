# Placement Dost — AI-Personalized Placement Prep Platform

> **AI-Powered Placement Ecosystem**: Built for campus recruitment drives featuring AI-personalized learning paths, fixed-rubric continuous assessment, Google Authentication, gamified consistency, focus mode enforcement, and peer-to-peer mentoring.

---

## 🎨 UI / Design System Requirements
- **Theme**: Strict **Light mode only** (No dark mode). Backgrounds are clean `#ffffff` and near-white `#f8fafc`.
- **Palette**: Strictly 2–3 colors:
  - **Primary Brand**: `#1e40af` (Deep Blue for headers, active buttons, and key CTAs)
  - **Neutral Grayscale**: `#0f172a` (Headings & text), `#64748b` (Subtext), `#e2e8f0` (Borders)
  - **Accent**: `#16a34a` (Subtle green for success states & streak badges)
- **Design Principles**: Generous whitespace, clean typographic hierarchy, plain borders, zero decorative clutter.

---

## 🛡️ Security Architecture & Audit Report
- **Zero Vulnerabilities**: Verified clean `npm audit` across both frontend and backend dependencies.
- **Vulnerability Elimination**:
  - Uninstalled vulnerable SheetJS (`xlsx`) and migrated to secure **`exceljs`** streaming with safe CSV line parsing.
  - Implemented 5MB upload limit and strict extension whitelisting (`.xlsx`, `.xls`, `.csv`).
  - Added package overrides for `uuid: ^11.1.1` to eliminate transitive prototype vulnerabilities.
- **Security Headers & Protection**:
  - Integrated **Helmet** with cross-origin resource policies.
  - Enabled **Express-Rate-Limit**: 500 req/15min general limiter, 100 req/15min auth limiter, and 60 req/15min grading limiters per IP.
- **Input Sanitization**:
  - Regex sanitization stripping `<>` and length bounds preventing XSS and injection.
- **Privacy & Hidden Marks (§4 Step 5)**:
  - Assignment marks are recorded in the database for struggle detection and peer matching, but strictly hidden from student client responses as specified by the prompt.

---

## 🔐 Google Authentication Integration
- **Institutional Google OAuth**:
  - Supports Google ID tokens via `google-auth-library` (`OAuth2Client`) with fallback payload decoding.
  - One-tap institutional sign-in modal (`mukesh.s@citchennai.net`, `priya.r@citchennai.net`) or custom Google email.
  - **+15 Welcome Bonus Points** automatically awarded upon Google registration.
  - Daily login streak detection and points crediting.

---

## 🏗️ Tech Stack

- **Frontend**: React (Vite 8), Tailwind CSS v4, Lucide React icons, responsive light UI layout.
- **Backend**: Node.js, Express.js REST API with CORS, Helmet, Rate Limiter.
- **Database**: Dual-mode persistence architecture:
  - Connects to MongoDB (`mongodb://127.0.0.1:27017/placement_dost`) when available.
  - Seamless persistent fallback to `backend/data/store.json` for zero-dependency offline running and evaluator demos.
- **AI Engine**: Google Gemini API integration with scoped reference-concept matching engine and deterministic rubric evaluator for 100% reliability and hallucination-free scoring.
- **Video Player**: Restricted linear video player (no seek forward, no pause-skip, linear watch-through required before recall write-up).

---

## 🚀 Key Feature Implementations

### 1. Onboarding Flow & Personalized Linear Video
- **Two Auth Paths**:
  - **Google Sign-In**: One-click Google authentication with +15 bonus points.
  - **New Student Onboarding**: Form capturing Name, Age, College (CIT, IIT Madras, Anna Univ, BITS Pilani, or Custom), Department, Primary Interest Area, Top Career Choice, and Key Interest Topics.
  - **Existing Student Sign-in**: Standard authentication with daily login bonus detection.
  - **Instant Demo Switcher**: One-click fast profile switcher to test leaderboards and peer matching.
- **Personalized Linear Video**:
  - Topic matched dynamically to stated interest (e.g., *Machine Learning Basics* for AI enthusiasts, *Binary Search Trees* for DSA, *Operating Systems & Memory* for CS Fundamentals).
  - Enforces linear watch-through: forward seeking and skipping are locked.
- **Recall Write-Up & Fixed 4-Dimension Rubric (§1a)**:
  - Students write what they understood in free text.
  - **Scoped AI Concept List**: Scoped generation of 3–6 benchmark technical terms per topic (generated once, cached, and reviewable by humans).
  - **Fixed Rubric Scoring (0–3 Scale)**:
    1. *Core Concept Accuracy* (0–3)
    2. *Key Terms Used Correctly* (0–3)
    3. *Depth & Elaboration* (0–3)
    4. *Clarity & Coherence* (0–3)
  - Normalized to a **0–100 Comprehension Baseline** and saved to the student's profile.

### 2. App Shell & Navigation
Top navigation bar featuring:
- **App Title**: `Placement Dost`
- **Dashboard**
- **Learn** (Learning Space)
- **Prep Plan** (Generic Near Placement Plan with countdown & readiness index)
- **DSA Practice**
- **Peer Mentors**
- **Points Badge** (interactive, opens the full Audit Ledger) & **Streak Flame**.

### 3. Home / Dashboard Page
1. **Multi-Dimensional Leaderboards**:
   - **College Leaderboard**: Filterable by college campus (e.g. *Chennai Institute of Technology*, *IIT Madras*, *Anna University*, *BITS Pilani*).
   - **Weekly Leaderboard**: Sprint points earned through streaks and solves.
   - **Global Standings**: Cross-college ranking with avatars and points.
2. **Continue Learning Card**:
   - Current stage progress and direct launch into the Focus-guarded Learning Space.
3. **Daily DSA Problem of the Day**:
   - Live streak counter and quick solve link.

### 4. Learning Space & Closed Interface Focus Mode
- **Four Placement Tracks**:
  - *Aptitude & Reasoning*
  - *Data Structures & Algorithms*
  - *CS Fundamentals*
  - *Projects (Guided Track)*
- **AI-Generated Roadmap**:
  - Multi-stage curriculum with completion percentages.
  - Sub-modules:
    - **Video Modules**: Embedded linear playback (+1 pt).
    - **Interactive Flashcards**: 3D flip card viewer with mastery tracking (+1 pt).
    - **Prerequisite Pointers**: Visual gap pointers indicating foundational topics.
    - **Project Modules**: Guided specifications, architecture diagrams, and milestone submissions.
- **Formative Interpretation Check (§4 Step 4)**:
  - Shows technical visuals (AVL tree right rotation, Overfitting loss curves, TCP 3-way handshake) with **no explanation**.
  - Student explains the behavior in their own words; evaluates intuition match in real-time.
- **Module Assignments (§4 Step 5)**:
  - Technical synthesis prompt scored against the fixed 4-dimension rubric.
  - **Hidden Marks**: Scores are stored in MongoDB and continuous assessment profiles without displaying raw numerical marks to the student.
- **Struggling Detection & Remediation (§4 Step 6)**:
  - If baseline or assignment score < 60%, automatically unlocks:
    - **Alternate Explanation Format**: Visual cheat-sheet and conceptual decomposition.
    - **Peer-to-Peer Learning Match**: Displays qualified student mentors (>80% proficiency) ready to help.

### 5. Focus Mode ("Closed Interface") & Exit Economy (§8)
- Engages when entering the Learning Space.
- Monitors browser visibility and tab blur events (`visibilitychange` / `blur`).
- **3 Free Step-Outs**: Students get 3 free exits per day.
- **Point Penalty Economy**: 4th exit costs 5 points, 5th costs 10 points (scaling by +5 points).
- All point deductions are audited in the `PointsLedger`.

### 6. DSA Practice Module (§5)
- **Daily DSA Problem Requirement**: Tracked as an active streak with milestone bonuses.
- **External Sheet Importer**:
  - Supports uploading `.xlsx`, `.xls`, `.csv` files or pasting JSON problem arrays safely parsed with `exceljs`.
  - Automatically parses and registers problems into the catalog.
- **Interactive Solver**:
  - Multi-language scratchpad (JavaScript, Python, C++, Java).
  - Evaluates test cases and awards points: Easy (+3), Medium (+8), Hard (+10).

### 7. Peer-to-Peer Learning Network & Incentive Model
- Matches struggling students with high-performing peers.
- **Helper Reward**:
  - Base reward: **+15 points** upon completing the session.
  - **Improvement Bonus**: **+5 points** if the helpee demonstrates post-remediation score improvement.

### 8. Gamification Economy Config Table (§7)

| Action | Points |
|---|---|
| Daily login | +1 |
| Google signup bonus | +15 |
| Solve DSA problem — Easy | +3 |
| Solve DSA problem — Medium | +8 |
| Solve DSA problem — Hard | +10 |
| Maintain daily streak → weekly streak | +1 |
| Complete a late/overdue problem | +1 |
| Complete a sub-module | +1 |
| Fully re-complete a module | +1 |
| Help another student via peer-to-peer | +15 (+5 bonus) |
| Focus Mode early exit (4th+ exit) | -5 (scaling) |

---

## 🏃 Running the Application

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`.*
*(If MongoDB is running locally, it connects to `mongodb://localhost:27017/placement_dost`; otherwise, it automatically uses the persistent fallback JSON database at `backend/data/store.json`)*.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 📊 MongoDB Data Model Collections (§10)

- `Users`: Student profile, college, points balance, streaks, free exits remaining, comprehension baseline.
- `AssessmentResults`: Video recall scores, rubric breakdowns, normalized baseline.
- `Roadmaps`: User personalized stage roadmap structure.
- `Modules`: Video, flashcard, prerequisite, and project module records.
- `Assignments`: Stored hidden marks and struggle detection status.
- `DSAProgress`: Solved status, points earned, and streak data.
- `PeerSessions`: Helper/helpee pairings, notes, and points awarded.
- `PointsLedger`: Complete audit trail of point-earning and spending events.
