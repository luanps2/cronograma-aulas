const db = require('./src/db');

async function debugDB() {
    try {
        const tables = ['courses', 'classes', 'ucs', 'labs'];
        for (const table of tables) {
            console.log(`\n--- ${table.toUpperCase()} SCHEMA ---`);
            const schema = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = '${table}'
            `);
            if (schema.rows.length === 0) {
                console.log(`Table '${table}' does not exist.`);
            } else {
                schema.rows.forEach(r => console.log(`${r.column_name} (${r.data_type}) NULL:${r.is_nullable}`));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

debugDB();
