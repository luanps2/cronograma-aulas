const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
require('dotenv').config();

let pool = null;
let isConnecting = false;

/**
 * Parse DATABASE_URL and create explicit config
 * This bypasses pg's internal DNS resolution that causes IPv6 issues
 */
function createPoolConfig() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set in environment variables');
    }

    // Parse the connection string into components
    const config = parse(connectionString);

    // Build explicit config object (avoids pg's DNS resolution)
    return {
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20,
        allowExitOnIdle: true
    };
}

/**
 * Initialize pool (lazy - only when first query happens)
 */
async function ensurePool() {
    if (pool) return pool;

    if (isConnecting) {
        // Wait for existing connection attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        return ensurePool();
    }

    isConnecting = true;

    try {
        const config = createPoolConfig();
        console.log(`🔄 Conectando ao PostgreSQL: ${config.host}:${config.port}/${config.database}`);

        pool = new Pool(config);

        // Test connection
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now, version() as version');
        client.release();

        console.log('✅ PostgreSQL conectado:', result.rows[0].now);
        console.log(`   Versão: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

        // Handle errors
        pool.on('error', (err) => {
            console.error('❌ Erro no pool do PostgreSQL:', err.message);
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
    pool: getPool, // Returns promise to pool
    testConnection
};
