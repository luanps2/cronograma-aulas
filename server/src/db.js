const { Pool } = require('pg');
const dns = require('dns').promises;
require('dotenv').config();

let pool = null;
let isConnecting = false;

// Configure DNS to use public resolvers (Render's DNS may be blocking Supabase)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

/**
 * Resolve hostname to IPv4 using public DNS
 */
async function resolveToIPv4(hostname) {
    try {
        console.log(`🔍 Resolvendo "${hostname}" com DNS público...`);

        // Try lookup with IPv4 family
        const addresses = await dns.resolve4(hostname);

        if (addresses && addresses.length > 0) {
            const ip = addresses[0];
            console.log(`✅ Resolvido: ${hostname} -> ${ip}`);
            return ip;
        }

        throw new Error('Nenhum endereço IPv4 retornado');
    } catch (error) {
        console.error(`❌ Falha DNS para ${hostname}:`, error.message);

        // Fallback: try standard lookup
        try {
            console.log('   Tentando fallback com dns.lookup...');
            const { address } = await dns.lookup(hostname, { family: 4 });
            console.log(`✅ Fallback OK: ${hostname} -> ${address}`);
            return address;
        } catch (fallbackError) {
            throw new Error(`DNS falhou: ${error.message}, Fallback: ${fallbackError.message}`);
        }
    }
}

/**
 * Build IPv4 connection string
 */
async function buildIPv4ConnectionString(connectionString) {
    const url = new URL(connectionString);
    const originalHost = url.hostname;

    // Skip localhost
    if (originalHost === 'localhost' || originalHost === '127.0.0.1') {
        return connectionString;
    }

    // Resolve to IPv4
    const ipv4Address = await resolveToIPv4(originalHost);

    // Replace hostname with IP
    url.hostname = ipv4Address;

    return url.toString();
}

/**
 * Create pool with IPv4 connection
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
            throw new Error('DATABASE_URL não configurado');
        }

        console.log('🔄 Inicializando conexão PostgreSQL...');

        // Force IPv4 by resolving DNS manually
        const ipv4ConnectionString = await buildIPv4ConnectionString(originalConnectionString);

        // Create pool
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
        const result = await client.query('SELECT NOW() as now');
        client.release();

        console.log('✅ PostgreSQL conectado:', result.rows[0].now);

        // Error handler
        pool.on('error', (err) => {
            console.error('❌ Pool error:', err.message);
        });

        return pool;

    } catch (error) {
        pool = null;
        console.error('❌ Falha ao conectar PostgreSQL:', error.message);
        throw error;
    } finally {
        isConnecting = false;
    }
}

/**
 * Execute query
 */
async function query(text, params) {
    await ensurePool();
    return pool.query(text, params);
}

/**
 * Get pool
 */
async function getPool() {
    await ensurePool();
    return pool;
}

/**
 * Test connection
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
