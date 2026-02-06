const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../src/schema-pg.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Dropping existing tables...');
        await db.query(`
            DROP TABLE IF EXISTS custom_links CASCADE;
            DROP TABLE IF EXISTS lessons CASCADE;
            DROP TABLE IF EXISTS classes CASCADE;
            DROP TABLE IF EXISTS labs CASCADE;
            DROP TABLE IF EXISTS ucs CASCADE;
            DROP TABLE IF EXISTS courses CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);

        console.log('Running Schema...');
        await db.query(schema);
        console.log('Schema created successfully.');
    } catch (err) {
        console.error('Error creating schema:', err);
    } finally {
        // End the pool to exit the script
        await db.pool.end();
    }
}

initDb();
