import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory + file-backed dual store for guaranteed zero-dependency fallback
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
export let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placement_dost';
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(` MongoDB Connected to ${conn.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.log(`ℹ️ MongoDB local daemon not reachable (${error.message}).`);
    console.log(`⚡ Seamless fallback active: Using persistent JSON store in /backend/data/store.json`);
  }
};
