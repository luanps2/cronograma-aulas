const { Pool } = require('pg');
const path = require('path');
const dns = require('dns').promises;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let pool = null;

// Objeto de exportação mutável para permitir atualização do 'pool'
const dbExports = {
    pool: null, // Será preenchido após connect()
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
                const addresses = await dns.resolve4(originalHost);

                if (addresses && addresses.length > 0) {
                    const ip = addresses[0];
                    console.log(`✅ DNS Resolvido: ${originalHost} -> ${ip}`);

                    // Atualiza a config para usar o IP diretamente
                    // Mantemos o connectionString original mas injetamos o host/port na config
                    // O pg usa as propriedades do objeto config com prioridade sobre a string se misturado,
                    // mas é mais seguro modificar a string ou passar host explicitamente.

                    // Modificando a URL para usar o IP
                    url.hostname = ip;
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
