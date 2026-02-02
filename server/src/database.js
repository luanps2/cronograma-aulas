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
`);

module.exports = db;
