const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Usa string de conexão do env, ou padrão apenas se definido explicitamente (segurança)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Módulo de Banco de Dados Padronizado
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool, // Exportando a instância do pool para transações
};
