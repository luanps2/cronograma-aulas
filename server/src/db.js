const { Pool } = require('pg');
const dns = require('dns').promises;
require('dotenv').config();

let pool = null;
let isConnecting = false;

/**
 * Resolve hostname to IPv4 address using OS resolver
 * This is the ONLY way to force IPv4 on Render
 */
async function resolveToIPv4(hostname) {
    try {
        console.log(`🔍 Resolvendo "${hostname}" para IPv4...`);
        const { address } = await dns.lookup(hostname, { family: 4 });
        console.log(`✅ Resolvido: ${hostname} -> ${address}`);
        return address;
    } catch (error) {
        console.error(`❌ Falha ao resolver ${hostname}:`, error.message);
        throw new Error(`Não foi possível resolver ${hostname} para IPv4: ${error.message}`);
    }
}

/**
 * Parse DATABASE_URL and replace hostname with IPv4 address
 */
async function buildIPv4ConnectionString(connectionString) {
    // Parse URL
    const url = new URL(connectionString);
    const originalHost = url.hostname;

    // Skip localhost
    if (originalHost === 'localhost' || originalHost === '127.0.0.1') {
        return connectionString;
    }

    // Force IPv4 resolution
    const ipv4Address = await resolveToIPv4(originalHost);

    // Replace hostname with IP
    url.hostname = ipv4Address;

    return url.toString();
}

/**
 * Create database pool with IPv4-forced connection
 */
async function ensurePool() {
    if (pool) return pool;

    if (isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return ensurePool();
    }

    isConnecting = true;

    try {
        const originalConnectionString = process.env.DATABASE_URL;

        if (!originalConnectionString) {
            throw new Error('DATABASE_URL não configurado nas variáveis de ambiente');
        }

        console.log('🔄 Inicializando conexão PostgreSQL...');

        // CRITICAL: Force IPv4 by resolving DNS manually
        const ipv4ConnectionString = await buildIPv4ConnectionString(originalConnectionString);

        // Create pool with IPv4 connection string
        const config = {
            connectionString: ipv4ConnectionString,
            ssl: process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 20,
            allowExitOnIdle: true
        };

        pool = new Pool(config);

        // Test connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now, version() as version');
        client.release();

        console.log('✅ PostgreSQL conectado:', result.rows[0].now);

        // Error handler
        pool.on('error', (err) => {
            console.error('❌ Erro no pool PostgreSQL:', err.message);
        });

        return pool;

    } catch (error) {
        pool = null;
        console.error('❌ Falha ao conectar no PostgreSQL:', error.message);
        throw error;
    } finally {
        isConnecting = false;
    }
}

/**
 * Execute query with automatic connection
 */
async function query(text, params) {
    await ensurePool();
    return pool.query(text, params);
}

/**
 * Get pool for transactions
 */
async function getPool() {
    await ensurePool();
    return pool;
}

/**
 * Test connection (for health checks)
 */
async function testConnection() {
    try {
        await ensurePool();
        const result = await pool.query('SELECT 1 as ok');
        return { connected: true, ok: result.rows[0].ok === 1 };
    } catch (error) {
        return { connected: false, error: error.message };
    }
}

module.exports = {
    query,
    pool: getPool,
    testConnection
};
