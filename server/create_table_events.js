const db = require('./src/db');

async function createEventsTable() {
    try {
        console.log('Criando tabela events...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                type VARCHAR(50) NOT NULL,
                color VARCHAR(20),
                period VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabela events criada com sucesso.');
    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error);
    } finally {
        await db.closePool();
    }
}

createEventsTable();
