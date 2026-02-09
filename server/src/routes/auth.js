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

        if (!email || !finalPassword) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

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

        const hashedPassword = await bcrypt.hash(finalPassword, 10);
        const userName = name || email.split('@')[0];

        const result = await db.query(
            `INSERT INTO users (email, password, name, provider)
       VALUES ($1, $2, $3, 'local')
       RETURNING id, email, name`,
            [email, hashedPassword, userName]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({ token, user });

    } catch (error) {
        console.error('Register Error:', error);
        // Retorna 500 JSON com detalhe seguro em dev
        res.status(500).json({
            error: 'Erro interno no servidor ao registrar usuário.',
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

        if (!email || !finalPassword) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const user = (
            await db.query('SELECT * FROM users WHERE email = $1', [email])
        ).rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (user.provider !== 'local') {
            return res.status(403).json({
                error: `Esta conta utiliza login com ${user.provider}.`
            });
        }

        const isMatch = await bcrypt.compare(finalPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

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
        console.error('Login Error:', error);
        res.status(500).json({
            error: 'Erro interno no servidor ao realizar login.',
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
        if (!credential) {
            return res.status(400).json({ error: 'Token do Google ausente.' });
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
        } catch (verifyError) {
            console.error('Google Verify Error:', verifyError);
            return res.status(401).json({ error: 'Token Google Inválido ou Expirado.' });
        }

        const { email, name, sub, picture } = payload;

        // 2. Database Operations (SEPARATE TRY/CATCH)
        // Se falhar aqui, É ERRO 500 (Server Error), NÃO 401 (Auth Error)
        try {
            let user = (
                await db.query('SELECT * FROM users WHERE email = $1', [email])
            ).rows[0];

            if (!user) {
                console.log(`Criando novo usuário Google: ${email}`);
                const result = await db.query(
                    `INSERT INTO users (email, password, name, avatar_url, provider, provider_id)
                 VALUES ($1, 'social_login_placeholder', $2, $3, 'google', $4)
                 RETURNING id, email, name, avatar_url`,
                    [email, name, picture, sub]
                );
                user = result.rows[0];
            } else {
                console.log(`Login Google existente: ${email}`);
                await db.query(
                    'UPDATE users SET avatar_url = $1 WHERE id = $2',
                    [picture, user.id]
                );
                user.avatar_url = picture;
            }

            const token = generateToken(user);
            res.json({ token, user });

        } catch (dbError) {
            console.error('❌ ERRO CRÍTICO DE BANCO DE DADOS (Google Auth):', dbError);
            // Retornar 500 para sabermos que o bug é infra/DB e não senha errada
            res.status(500).json({
                error: 'Erro interno ao salvar usuário.',
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
            });
        }

    } catch (error) {
        console.error('Unexpected Google Auth Error:', error);
        res.status(500).json({ error: 'Erro inesperado no servidor.' });
    }
});

module.exports = router;
