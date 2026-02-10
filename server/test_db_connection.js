/**
 * Script de teste rápido para validar conexão com banco de dados
 * 
 * Uso: node test_db_connection.js
 */

require('dotenv').config();
const db = require('./src/db');

async function testDatabaseConnection() {
    console.log('🔍 Testando conexão com banco de dados...\n');

    // Test 1: Health Check
    console.log('1️⃣ Teste de Health Check:');
    try {
        const health = await db.testConnection();

        if (health.connected) {
            console.log('   ✅ Status: CONECTADO');
            console.log(`   ✅ Pool Size: ${health.poolSize || 'N/A'}`);
            console.log(`   ✅ Idle: ${health.idleCount || 'N/A'}`);
            console.log(`   ✅ Waiting: ${health.waitingCount || 'N/A'}\n`);
        } else {
            console.log('   ❌ Status: DESCONECTADO');
            console.log(`   ❌ Erro: ${health.error}\n`);
            throw new Error(health.error);
        }
    } catch (error) {
        console.error('   ❌ Falha no health check:', error.message);
        process.exit(1);
    }

    // Test 2: Simple Query
    console.log('2️⃣ Teste de Query Simples:');
    try {
        const result = await db.query('SELECT NOW() as timestamp, current_database() as database, version() as version');
        const row = result.rows[0];

        console.log('   ✅ Query executada com sucesso');
        console.log(`   ✅ Timestamp: ${row.timestamp}`);
        console.log(`   ✅ Database: ${row.database}`);
        console.log(`   ✅ Version: ${row.version.substring(0, 50)}...\n`);
    } catch (error) {
        console.error('   ❌ Falha na query:', error.message);
        process.exit(1);
    }

    // Test 3: Check Users Table
    console.log('3️⃣ Teste de Tabela Users:');
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM users');
        const count = result.rows[0].count;

        console.log('   ✅ Tabela users acessível');
        console.log(`   ✅ Total de usuários: ${count}\n`);
    } catch (error) {
        console.error('   ❌ Falha ao acessar tabela users:', error.message);
        console.error('   ⚠️  Verifique se a tabela existe no banco\n');
        process.exit(1);
    }

    // Test 4: Check Other Tables
    console.log('4️⃣ Teste de Outras Tabelas:');
    const tables = ['courses', 'classes', 'ucs', 'lessons', 'labs'];

    for (const table of tables) {
        try {
            const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
            const count = result.rows[0].count;
            console.log(`   ✅ ${table.padEnd(10)} - ${count} registros`);
        } catch (error) {
            console.log(`   ⚠️  ${table.padEnd(10)} - Não acessível (${error.message})`);
        }
    }

    console.log('\n5️⃣ Teste de Variáveis de Ambiente:');
    const envVars = {
        'DATABASE_URL': process.env.DATABASE_URL ? '✅ Configurado' : '❌ AUSENTE',
        'JWT_SECRET': process.env.JWT_SECRET ? '✅ Configurado' : '❌ AUSENTE',
        'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ AUSENTE',
        'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY ? '✅ Configurado' : '⚠️  Ausente (opcional)',
        'NODE_ENV': process.env.NODE_ENV || 'development',
        'PORT': process.env.PORT || '5000'
    };

    for (const [key, value] of Object.entries(envVars)) {
        console.log(`   ${key.padEnd(20)} ${value}`);
    }

    // Test 6: Validate DATABASE_URL format
    console.log('\n6️⃣ Validação de DATABASE_URL:');
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl) {
        try {
            const url = new URL(dbUrl);

            console.log(`   Protocol: ${url.protocol}`);
            console.log(`   Host: ${url.hostname}`);
            console.log(`   Port: ${url.port}`);
            console.log(`   Database: ${url.pathname.substring(1)}`);

            // Check if using Session Pooler (port 6543)
            if (url.port === '6543') {
                console.log('   ✅ Usando Session Pooler (porta 6543) - CORRETO para produção');
            } else if (url.port === '5432') {
                console.log('   ⚠️  Usando Direct Connection (porta 5432)');
                console.log('   ⚠️  Recomendado: Use Session Pooler (porta 6543) em produção');
            } else {
                console.log(`   ⚠️  Porta não padrão: ${url.port}`);
            }

        } catch (error) {
            console.log('   ❌ DATABASE_URL malformada:', error.message);
        }
    } else {
        console.log('   ❌ DATABASE_URL não configurada');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(60));
    console.log('\n💡 Próximo passo: Inicie o servidor com "npm start"\n');

    // Close pool
    await db.closePool();
    process.exit(0);
}

// Run tests
testDatabaseConnection().catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    console.error('\n📋 Verifique:');
    console.error('   1. DATABASE_URL está correta no .env');
    console.error('   2. Banco de dados está acessível');
    console.error('   3. Tabelas existem no banco\n');
    process.exit(1);
});
