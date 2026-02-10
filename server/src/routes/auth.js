const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const db = require('../db');
const { JWT_SECRET } = require('../config');

const router = express.Router();

// =======================
// Helper JWT
// =======================
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

// =======================
// REGISTER (LOCAL)
// =======================
router.post('/register', async (req, res) => {
    try {
        const { email, senha, password, name } = req.body;
        const finalPassword = senha || password;

        console.log(`[AUTH] POST /register - ${email || 'no email'}`);

        // Input validation
        if (!email || !finalPassword) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        if (typeof email !== 'string' || typeof finalPassword !== 'string') {
            return res.status(400).json({ error: 'Formato inválido de email ou senha.' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }

        // Password strength validation
        if (finalPassword.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
        }

        // DATABASE OPERATIONS - ISOLATED TRY/CATCH
        try {
            // Check if user already exists
            const existingUser = (
                await db.query('SELECT * FROM users WHERE email = $1', [email])
            ).rows[0];

            if (existingUser) {
                if (existingUser.provider !== 'local') {
                    return res.status(409).json({
                        error: `Este email já está vinculado ao login com ${existingUser.provider}.`
                    });
                }
                return res.status(409).json({ error: 'Usuário já existe.' });
            }

            // Hash password
            let hashedPassword;
            try {
                hashedPassword = await bcrypt.hash(finalPassword, 10);
            } catch (hashError) {
                console.error('❌ bcrypt Hash Error:', hashError);
                return res.status(500).json({
                    error: 'Erro ao processar senha. Tente novamente.',
                    details: process.env.NODE_ENV === 'development' ? hashError.message : undefined
                });
            }

            const userName = name || email.split('@')[0];

            // Insert new user
            const result = await db.query(
                `INSERT INTO users (email, password, name, provider)
                 VALUES ($1, $2, $3, 'local')
                 RETURNING id, email, name`,
                [email, hashedPassword, userName]
            );

            const user = result.rows[0];
            const token = generateToken(user);

            res.status(201).json({ token, user });

        } catch (dbError) {
            console.error('❌ Database Error (Register):', dbError);

            // Handle specific PostgreSQL errors
            if (dbError.code === '23505') { // Unique constraint violation
                return res.status(409).json({
                    error: 'Usuário já existe.'
                });
            }

            return res.status(500).json({
                error: 'Erro ao acessar banco de dados. Tente novamente.',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }

    } catch (error) {
        console.error('❌ Unexpected Register Error:', error);
        res.status(500).json({
            error: 'Erro inesperado no servidor.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// =======================
// LOGIN (LOCAL)
// =======================
router.post('/login', async (req, res) => {
    try {
        const { email, senha, password } = req.body;
        const finalPassword = senha || password;

        console.log(`[AUTH] POST /login - ${email || 'no email'}`);

        // Input validation
        if (!email || !finalPassword) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        if (typeof email !== 'string' || typeof finalPassword !== 'string') {
            return res.status(400).json({ error: 'Formato inválido de email ou senha.' });
        }

        // DATABASE OPERATIONS - ISOLATED TRY/CATCH
        let user;
        try {
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            user = result.rows[0];
        } catch (dbError) {
            console.error('❌ Database Error (Login - SELECT):', dbError);
            return res.status(500).json({
                error: 'Erro ao acessar banco de dados. Tente novamente.',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }

        // User not found
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Check if user is using social login
        if (user.provider !== 'local') {
            return res.status(403).json({
                error: `Esta conta utiliza login com ${user.provider}. Use o botão correspondente para entrar.`
            });
        }

        // CRITICAL: Validate stored password before bcrypt
        if (!user.password || typeof user.password !== 'string' || user.password.trim() === '') {
            console.error(`⚠️  User ${user.email} has invalid password in database (provider: ${user.provider})`);
            return res.status(403).json({
                error: `Esta conta foi criada com login social. Não é possível usar email/senha.`
            });
        }

        // Prevent bcrypt from processing placeholder passwords
        if (user.password === 'social_login_placeholder') {
            console.error(`⚠️  User ${user.email} has placeholder password (provider: ${user.provider})`);
            return res.status(403).json({
                error: `Esta conta foi criada com ${user.provider || 'login social'}. Não é possível usar email/senha.`
            });
        }

        // Verify password with bcrypt
        let isMatch;
        try {
            isMatch = await bcrypt.compare(finalPassword, user.password);
        } catch (bcryptError) {
            console.error('❌ bcrypt Error (Login):', bcryptError);
            return res.status(500).json({
                error: 'Erro ao verificar senha. Tente novamente.',
                details: process.env.NODE_ENV === 'development' ? bcryptError.message : undefined
            });
        }

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Generate JWT token
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url
            }
        });

    } catch (error) {
        console.error('❌ Unexpected Login Error:', error);
        res.status(500).json({
            error: 'Erro inesperado no servidor.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// =======================
// GOOGLE LOGIN (GIS)
// =======================
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        console.log(`[AUTH] POST /google - credential ${credential ? 'present' : 'missing'}`);

        // Validate input
        if (!credential) {
            return res.status(400).json({ error: 'Token do Google ausente.' });
        }

        if (typeof credential !== 'string') {
            return res.status(400).json({ error: 'Token do Google inválido.' });
        }

        // Validate environment
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('❌ GOOGLE_CLIENT_ID não configurado nas variáveis de ambiente');
            return res.status(500).json({
                error: 'Configuração do servidor incompleta.',
                details: process.env.NODE_ENV === 'development' ? 'GOOGLE_CLIENT_ID missing' : undefined
            });
        }

        // 1. Verify Token with Google
        let payload;
        try {
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();

            console.log(`✅ Google token verified for: ${payload.email}`);
            console.log(`   Name: ${payload.name}`);
            console.log(`   Sub: ${payload.sub}`);

        } catch (verifyError) {
            console.error('❌ Google Token Verification Failed:', verifyError.message);

            // Specific error messages for common Google OAuth errors
            if (verifyError.message.includes('Token used too late')) {
                return res.status(401).json({ error: 'Token do Google expirado. Tente fazer login novamente.' });
            }

            if (verifyError.message.includes('Invalid token signature')) {
                return res.status(401).json({ error: 'Token do Google inválido. Tente novamente.' });
            }

            if (verifyError.message.includes('Wrong recipient')) {
                console.error('   AUDIENCE MISMATCH - Verifique GOOGLE_CLIENT_ID');
                return res.status(401).json({ error: 'Configuração de autenticação incorreta.' });
            }

            return res.status(401).json({
                error: 'Falha ao verificar token do Google.',
                details: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
            });
        }

        // Extract user data from Google payload
        const { email, name, sub, picture } = payload;

        if (!email || !sub) {
            console.error('❌ Google payload missing required fields:', { email, sub });
            return res.status(400).json({ error: 'Dados do Google incompletos.' });
        }

        // 2. Database Operations (SEPARATE TRY/CATCH)
        // If this fails, it's a SERVER ERROR (500), NOT an AUTH ERROR (401)
        try {
            let user = (
                await db.query('SELECT * FROM users WHERE email = $1', [email])
            ).rows[0];

            if (!user) {
                // Create new user from Google account
                console.log(`📝 Criando novo usuário Google: ${email}`);

                const result = await db.query(
                    `INSERT INTO users (email, password, name, avatar_url, provider, provider_id)
                     VALUES ($1, 'social_login_placeholder', $2, $3, 'google', $4)
                     RETURNING id, email, name, avatar_url`,
                    [email, name, picture, sub]
                );

                user = result.rows[0];
                console.log(`✅ Usuário criado com sucesso: ID ${user.id}`);

            } else {
                // Update existing user's avatar
                console.log(`✅ Login Google existente: ${email} (ID: ${user.id})`);

                // Only update avatar if changed
                if (user.avatar_url !== picture) {
                    console.log(`   Atualizando avatar...`);
                    await db.query(
                        'UPDATE users SET avatar_url = $1 WHERE id = $2',
                        [picture, user.id]
                    );
                    user.avatar_url = picture;
                }

                // Update provider info if user was created locally but now using Google
                if (user.provider === 'local') {
                    console.log(`   Atualizando provider de 'local' para 'google'...`);
                    await db.query(
                        'UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3',
                        ['google', sub, user.id]
                    );
                    user.provider = 'google';
                    user.provider_id = sub;
                }
            }

            // Generate JWT token
            const token = generateToken(user);

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar_url: user.avatar_url
                }
            });

        } catch (dbError) {
            console.error('❌ ERRO CRÍTICO DE BANCO DE DADOS (Google Auth):');
            console.error('   Erro:', dbError.message);
            console.error('   Code:', dbError.code);
            console.error('   Detail:', dbError.detail);

            // Handle specific PostgreSQL errors
            if (dbError.code === '23505') { // Unique constraint violation
                return res.status(409).json({
                    error: 'Conflito ao criar usuário. Tente novamente.'
                });
            }

            // Return 500 to indicate it's infrastructure/DB issue, not auth failure
            res.status(500).json({
                error: 'Erro interno ao processar autenticação.',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }

    } catch (error) {
        console.error('❌ Unexpected Google Auth Error:', error);
        res.status(500).json({
            error: 'Erro inesperado no servidor.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
