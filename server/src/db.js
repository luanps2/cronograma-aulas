const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let isConnecting = false;

/**
 * Create PostgreSQL pool (lazy initialization)
 * CRITICAL: Uses Supabase Session Pooler (IPv4) - port 6543
 */
async function ensurePool() {
    if (pool) return pool;

    if (isConnecting) {
        // Wait for ongoing connection attempt
        await new Promise(resolve => setTimeout(resolve, 100));
        return ensurePool();
    }

    isConnecting = true;

    try {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL não configurado nas variáveis de ambiente');
        }

        console.log('🔄 Inicializando conexão PostgreSQL (Supabase Session Pooler)...');

        // Pool configuration for Supabase Session Pooler
        const config = {
            connectionString,
            ssl: process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false,
            connectionTimeoutMillis: 15000,  // Increased timeout for Render/Supabase
            query_timeout: 30000,
            idleTimeoutMillis: 30000,
            max: 10,  // Conservative pool size for serverless
            min: 0,   // No minimum connections (serverless-friendly)
            allowExitOnIdle: true
        };

        pool = new Pool(config);

        // Test connection immediately
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now, current_database() as db');
        client.release();

        console.log('✅ PostgreSQL conectado:');
        console.log(`   Timestamp: ${result.rows[0].now}`);
        console.log(`   Database: ${result.rows[0].db}`);

        // Global error handler (prevent uncaught exceptions)
        pool.on('error', (err) => {
            console.error('❌ Erro inesperado no pool PostgreSQL:', err.message);
            // DO NOT crash the server - just log
        });

        return pool;

    } catch (error) {
        pool = null;
        console.error('❌ Falha ao conectar PostgreSQL:', error.message);
        console.error('   Verifique DATABASE_URL e conectividade de rede');
        throw error;
    } finally {
        isConnecting = false;
    }
}

/**
 * Execute query with automatic retry
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @param {number} retries - Number of retry attempts
 */
async function query(text, params, retries = 2) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await ensurePool();

            // Double-check pool exists
            if (!pool) {
                throw new Error('Pool não foi inicializado');
            }

            return await pool.query(text, params);

        } catch (error) {
            lastError = error;
            console.error(`❌ Query falhou (tentativa ${attempt}/${retries}):`, error.message);

            // Don't retry on validation errors
            if (error.code === '23505') { // Unique constraint violation
                throw error;
            }
            if (error.code === '23503') { // Foreign key violation
                throw error;
            }
            if (error.code === '42P01') { // Table does not exist
                throw error;
            }

            if (attempt < retries) {
                // Reset pool to force reconnect on next attempt
                if (pool) {
                    try {
                        await pool.end();
                    } catch (endError) {
                        console.error('   Erro ao fechar pool:', endError.message);
                    }
                }
                pool = null;

                // Exponential backoff: 200ms, 400ms
                const delay = 200 * Math.pow(2, attempt - 1);
                console.log(`   Reconectando em ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // All retries failed
    throw new Error(`Falha na query após ${retries} tentativas: ${lastError.message}`);
}

/**
 * Get pool instance (for advanced use cases)
 */
async function getPool() {
    await ensurePool();
    return pool;
}

/**
 * Test connection health
 */
async function testConnection() {
    try {
        await ensurePool();
        const result = await pool.query('SELECT 1 as ok');
        return {
            connected: true,
            ok: result.rows[0].ok === 1,
            poolSize: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
    } catch (error) {
        console.error('❌ Teste de conexão falhou:', error.message);
        return {
            connected: false,
            error: error.message
        };
    }
}

/**
 * Graceful shutdown
 */
async function closePool() {
    if (pool) {
        console.log('🔄 Encerrando pool PostgreSQL...');
        await pool.end();
        pool = null;
        console.log('✅ Pool encerrado');
    }
}

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await closePool();
    process.exit(0);
});

module.exports = {
    query,
    pool: getPool,
    testConnection,
    closePool
};
