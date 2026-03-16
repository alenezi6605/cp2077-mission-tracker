const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'missions.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('main', 'side', 'gig')),
    priority TEXT NOT NULL CHECK(priority IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'tracked', 'completed', 'failed')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

module.exports = db;
