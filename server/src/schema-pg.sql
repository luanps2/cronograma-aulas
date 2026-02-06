-- Postgres Schema for Senac Sonic Aphelion

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    provider VARCHAR(50) DEFAULT 'local',
    provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    number VARCHAR(50),
    courseId INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    year VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS ucs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "desc" TEXT, -- desc is reserved keyword in PG, quoted
    hours INTEGER,
    courseId INTEGER REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS labs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER
);

CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    courseId INTEGER REFERENCES courses(id),
    turma VARCHAR(255), -- Denormalized/Loose reference or could link to classes? Keeping loose as per original SQLite
    ucId INTEGER REFERENCES ucs(id),
    ucName VARCHAR(255),
    period VARCHAR(50), -- Manhã, Tarde, Noite
    lab VARCHAR(255),
    date DATE, -- Or TIMESTAMP
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category VARCHAR(100),
    icon VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
