const sqlite3 = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sqliteDbPath = path.join(__dirname, '../database.sqlite');
const pgConnectionString = process.env.DATABASE_URL;

if (!pgConnectionString) {
    console.error('Error: DATABASE_URL not found in .env');
    process.exit(1);
}

const sqlite = new sqlite3(sqliteDbPath);
const pg = new Pool({ connectionString: pgConnectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

async function migrate() {
    console.log('Starting migration...');

    // 1. Create Schema (Load from schema-pg.sql if needed, but assuming user ran it or we run it here)
    // We'll trust the user to run schema creation or we can try to infer.
    // Let's run the schema-pg.sql content here safely? NO, let's assume tables exist or are created.
    // Actually, let's create tables to be sure.
    // ... Skipping schema creation inside migration script to keep it simple, assume schema-pg.sql was executed manually or via another script.

    const client = await pg.connect();

    try {
        await client.query('BEGIN');

        // Migrate Users
        console.log('Migrating Users...');
        const users = sqlite.prepare('SELECT * FROM users').all();
        for (const user of users) {
            await client.query(
                'INSERT INTO users (id, email, password, name, avatar_url, provider, provider_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
                [user.id, user.email, user.password, user.name, user.avatar_url, user.provider, user.provider_id, user.created_at]
            );
        }

        // Migrate Courses
        console.log('Migrating Courses...');
        const courses = sqlite.prepare('SELECT * FROM courses').all();
        for (const c of courses) {
            await client.query('INSERT INTO courses (id, name, acronym) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [c.id, c.name, c.acronym]);
        }
        // Sync Sequence
        if (courses.length > 0) await client.query("SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses))");

        // Migrate Classes
        console.log('Migrating Classes...');
        const classes = sqlite.prepare('SELECT * FROM classes').all();
        for (const c of classes) {
            await client.query('INSERT INTO classes (id, name, number, courseId, year) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING', [c.id, c.name, c.number, c.courseId, c.year]);
        }
        if (classes.length > 0) await client.query("SELECT setval('classes_id_seq', (SELECT MAX(id) FROM classes))");

        // Migrate UCs
        console.log('Migrating UCs...');
        const ucs = sqlite.prepare('SELECT * FROM ucs').all();
        for (const u of ucs) {
            const hours = parseInt(u.hours) || 0;
            await client.query('INSERT INTO ucs (id, name, "desc", hours, courseId) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING', [u.id, u.name, u.desc, hours, u.courseId]);
        }
        if (ucs.length > 0) await client.query("SELECT setval('ucs_id_seq', (SELECT MAX(id) FROM ucs))");

        // Migrate Labs
        console.log('Migrating Labs...');
        const labs = sqlite.prepare('SELECT * FROM labs').all();
        for (const l of labs) {
            const capacity = parseInt(l.capacity) || 0;
            await client.query('INSERT INTO labs (id, name, capacity) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [l.id, l.name, capacity]);
        }
        if (labs.length > 0) await client.query("SELECT setval('labs_id_seq', (SELECT MAX(id) FROM labs))");

        // Migrate Lessons
        console.log('Migrating Lessons...');
        const lessons = sqlite.prepare('SELECT * FROM lessons').all();
        for (const l of lessons) {
            await client.query(
                'INSERT INTO lessons (id, courseId, turma, ucId, ucName, period, lab, date, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
                [l.id, l.courseId, l.turma, l.ucId, l.ucName, l.period, l.lab, l.date, l.description]
            );
        }
        if (lessons.length > 0) await client.query("SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons))");

        // Migrate Custom Links
        console.log('Migrating Custom Links...');
        try {
            // Check if table exists in SQLite first
            const links = sqlite.prepare('SELECT * FROM custom_links').all();
            for (const link of links) {
                await client.query(
                    'INSERT INTO custom_links (id, user_id, title, url, category, icon, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
                    [link.id, link.user_id, link.title, link.url, link.category, link.icon, link.created_at]
                );
            }
            if (links.length > 0) await client.query("SELECT setval('custom_links_id_seq', (SELECT MAX(id) FROM custom_links))");
        } catch (e) {
            console.log('No custom_links table in SQLite or error migrating links (skipping):', e.code);
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        await pg.end();
    }
}

migrate();
