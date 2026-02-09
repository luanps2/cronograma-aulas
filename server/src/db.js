const { Pool } = require('pg');
const path = require('path');
const dns = require('dns').promises;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool = null;

const dbExports = {
    pool: null,
    query: async (text, params) => {
        if (!pool) {
            console.error('⚠️ DB Query attempted before initialization!'); // Warn if query called early
            throw new Error('Database not initialized. Call connect() first.');
        }
        return pool.query(text, params);
    },
    connect: async () => {
        if (pool) return pool;

        console.log('🔄 Inicializando conexão com o Banco de Dados (Tentativa IPv4)...');
        let connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL not set in environment variables');
        }

        let config = {
            connectionString,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            allowExitOnIdle: true
        };

        try {
            // FORCE IPv4: Render often defaults to IPv6 which Supabase doesn't fully support on free tiers
            // checks if we need to resolve
            if (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')) {
                const url = new URL(connectionString);
                const originalHost = url.hostname;

                console.log(`🔍 Resolvendo DNS IPv4 para: ${originalHost}`);

                // dns.lookup with family: 4 matches standard getaddrinfo behavior
                const { address } = await dns.lookup(originalHost, { family: 4 });

                if (address) {
                    console.log(`✅ DNS Resolvido: ${originalHost} -> ${address}`);

                    // Rewrite config to use IP
                    url.hostname = address;
                    config.connectionString = url.toString();
                } else {
                    throw new Error(`Nenhum endereço IPv4 encontrado para ${originalHost}`);
                }
            }
        } catch (dnsError) {
            console.error('❌ Falha CRÍTICA na resolução DNS IPv4:', dnsError.message);
            // FAIL FAST: Não tente conectar com o original se a resolução falhou, 
            // pois isso causa o ENETUNREACH IPv6 que derruba o app.
            throw dnsError;
        }

        // Initialize Pool with IPv4 Config
        pool = new Pool(config);

        // Connectivity Test
        try {
            const client = await pool.connect();
            const res = await client.query('SELECT NOW()');
            client.release();
            console.log('✅ Banco de Dados conectado com sucesso:', res.rows[0].now);

            dbExports.pool = pool;
            return pool;
        } catch (err) {
            console.error('❌ Erro Crítico ao conectar no Pool do DB:', err.message);
            throw err;
        }
    }
};

module.exports = dbExports;
