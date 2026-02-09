const { Pool } = require('pg');
const path = require('path');
const dns = require('dns').promises;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool = null;

const dbExports = {
    pool: null,
    query: async (text, params) => {
        if (!pool) {
            throw new Error('Database not initialized. Call connect() first.');
        }
        return pool.query(text, params);
    },
    connect: async () => {
        if (pool) return pool;

        console.log('🔄 Inicializando conexão com o Banco de Dados...');
        let connectionString = process.env.DATABASE_URL;
        let config = {
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            allowExitOnIdle: true
        };

        try {
            // Tenta resolver IPv4 manualmente para evitar problemas com IPv6 no Render
            // Apenas se não for localhost
            if (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) {
                const url = new URL(connectionString);
                const originalHost = url.hostname;

                console.log(`🔍 Resolvendo DNS para: ${originalHost}`);
                // FIX: dns.lookup com family: 4 usa o resolver do SO (getaddrinfo), 
                // que funciona melhor no Render do que dns.resolve4 (query direta).
                const { address } = await dns.lookup(originalHost, { family: 4 });

                if (address) {
                    console.log(`✅ DNS Resolvido: ${originalHost} -> ${address}`);

                    // Atualiza a config para usar o IP diretamente
                    url.hostname = address;
                    config.connectionString = url.toString();

                    console.log('Using IPv4 Connection String (Host replaced with IP)');
                }
            }
        } catch (dnsError) {
            console.warn('⚠️ Falha na resolução DNS IPv4 manual, usando original:', dnsError.message);
        }

        pool = new Pool(config);

        // Teste de Conexão
        try {
            const client = await pool.connect();
            const res = await client.query('SELECT NOW()');
            client.release();
            console.log('✅ Banco de Dados conectado com sucesso:', res.rows[0].now);

            // Atualiza export
            dbExports.pool = pool;
            return pool;
        } catch (err) {
            console.error('❌ Erro Crítico ao conectar no Pool do DB:', err);
            throw err;
        }
    }
};

module.exports = dbExports;
