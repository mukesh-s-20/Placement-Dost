import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seamless local JSON store for offline/standalone zero-dependency fallback
class JsonDb {
  constructor() {
    this.data = {
      users: [],
      assessmentResults: [],
      roadmaps: [],
      modules: [],
      assignments: [],
      dsaProgress: [],
      dsaProblems: [],
      peerSessions: [],
      pointsLedger: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not load store.json, using fresh in-memory store:', e.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving store.json:', e.message);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }
}

export const jsonDb = new JsonDb();
export let isPostgresConnected = false;
export let pgPool = null;

const connectionString = process.env.DATABASE_URL ||
  process.env.POSTGRES_URI ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'placement_dost'}`;

// Initialize PostgreSQL Connection and Run Schema Migrations
export const connectPostgres = async () => {
  try {
    const isCloud = connectionString.includes('sslmode=require') || connectionString.includes('supabase') || connectionString.includes('neon') || connectionString.includes('render');
    
    pgPool = new Pool({
      connectionString,
      ssl: isCloud ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 3000
    });

    // Test connection
    const client = await pgPool.connect();
    isPostgresConnected = true;
    console.log(`=======================================================`);
    console.log(`🐘 PostgreSQL Connected Successfully!`);
    console.log(`📍 Connection: ${connectionString.split('@')[1] || 'localhost:5432'}`);
    console.log(`=======================================================`);

    // Run Auto-Migrations for all §10 collections
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(180) UNIQUE NOT NULL,
        age INT DEFAULT 20,
        college VARCHAR(150),
        department VARCHAR(150),
        interest_area VARCHAR(150),
        top_career_choice VARCHAR(150),
        key_interest_topics TEXT[],
        points INT DEFAULT 10,
        streak_daily INT DEFAULT 1,
        streak_weekly INT DEFAULT 1,
        last_login_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        free_exits_remaining INT DEFAULT 3,
        exit_count_today INT DEFAULT 0,
        comprehension_baseline INT DEFAULT 0,
        baseline_completed BOOLEAN DEFAULT FALSE,
        topic_proficiencies JSONB DEFAULT '{}'::jsonb,
        role VARCHAR(50) DEFAULT 'student',
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assessment_results (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(150) NOT NULL,
        video_id VARCHAR(150),
        write_up TEXT NOT NULL,
        rubric_scores JSONB,
        total_score INT,
        normalized_score INT,
        reference_concepts TEXT[],
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS roadmaps (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        track VARCHAR(80) NOT NULL,
        topic VARCHAR(150) NOT NULL,
        title VARCHAR(200),
        stages JSONB,
        completed_modules TEXT[],
        progress_percent INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS modules (
        module_id VARCHAR(64) PRIMARY KEY,
        track VARCHAR(80),
        stage_id VARCHAR(80),
        title VARCHAR(200),
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'unlocked',
        duration VARCHAR(50),
        video_url TEXT,
        summary TEXT,
        flashcards JSONB,
        project_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        module_id VARCHAR(64),
        topic VARCHAR(150),
        prompt TEXT,
        student_submission TEXT,
        reference_concepts TEXT[],
        rubric_scores JSONB,
        hidden_marks INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dsa_problems (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        difficulty VARCHAR(50),
        topic VARCHAR(100),
        source_sheet VARCHAR(100),
        url TEXT,
        description TEXT,
        examples TEXT,
        test_cases JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dsa_progress (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        problem_id VARCHAR(64),
        difficulty VARCHAR(50),
        source_sheet VARCHAR(100),
        status VARCHAR(50) DEFAULT 'solved',
        points_earned INT,
        solved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS peer_sessions (
        id VARCHAR(64) PRIMARY KEY,
        helpee_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        helpee_name VARCHAR(120),
        helper_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        helper_name VARCHAR(120),
        topic VARCHAR(150),
        status VARCHAR(50) DEFAULT 'requested',
        meet_url TEXT DEFAULT 'https://meet.google.com/new',
        meet_code VARCHAR(100),
        helper_points_awarded INT DEFAULT 0,
        remediation_score_before INT,
        remediation_score_after INT,
        notes TEXT,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS points_ledger (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
        amount INT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        description TEXT,
        balance_after INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    client.release();
    console.log(`✅ PostgreSQL Tables & Indexes Verified.`);
  } catch (error) {
    isPostgresConnected = false;
    console.log(`ℹ️ PostgreSQL local daemon not reachable (${error.message}).`);
    console.log(`⚡ Seamless fallback active: Using persistent local storage in /backend/data/store.json`);
    console.log(`💡 To connect PostgreSQL, set DATABASE_URL in backend/.env (e.g. Supabase, Neon, or local Postgres)`);
  }
};
