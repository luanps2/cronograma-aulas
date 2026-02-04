const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'local',
    provider_id TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    acronym TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    courseId INTEGER NOT NULL,
    year TEXT,
    FOREIGN KEY (courseId) REFERENCES courses (id)
  );

  CREATE TABLE IF NOT EXISTS ucs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    desc TEXT NOT NULL,
    hours TEXT NOT NULL,
    courseId INTEGER NOT NULL,
    FOREIGN KEY (courseId) REFERENCES courses (id)
  );

  CREATE TABLE IF NOT EXISTS labs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity TEXT
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    turma TEXT NOT NULL,
    ucId INTEGER NOT NULL,
    ucName TEXT NOT NULL,
    period TEXT CHECK(period IN ('Manhã', 'Tarde', 'Noite')) NOT NULL,
    lab TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (courseId) REFERENCES courses (id),
    FOREIGN KEY (ucId) REFERENCES ucs (id)
  );

  CREATE TABLE IF NOT EXISTS custom_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Migration for existing tables: Add columns if they don't exist
try {
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();

  const hasProvider = tableInfo.some(col => col.name === 'provider');
  if (!hasProvider) {
    db.prepare('ALTER TABLE users ADD COLUMN provider TEXT DEFAULT "local"').run();
    db.prepare('ALTER TABLE users ADD COLUMN provider_id TEXT').run();
  }

  const hasAvatar = tableInfo.some(col => col.name === 'avatar_url');
  if (!hasAvatar) {
    db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run();
  }

} catch (error) {
  console.error('Migration error:', error);
}

module.exports = db;
