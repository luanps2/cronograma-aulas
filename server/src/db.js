const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuração robusta para Produção (Render)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000, // 5s timeout para conectar
    idleTimeoutMillis: 30000,      // 30s para fechar conexões inativas
    allowExitOnIdle: true          // Permite que o processo node feche se o pool estiver ocioso
});

// Teste de Conexão na Inicialização
pool.connect()
    .then(client => {
        return client.query('SELECT NOW()')
            .then(res => {
                client.release();
                console.log('✅ Banco de Dados conectado com sucesso:', res.rows[0].now);
            })
            .catch(err => {
                client.release();
                console.error('❌ Erro no teste de conexão ao DB:', err);
            });
    })
    .catch(err => {
        console.error('❌ Erro Crítico ao conectar no Pool do DB:', err);
    });

// Módulo de Banco de Dados Padronizado
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool, // Exportando a instância do pool para transações
};
