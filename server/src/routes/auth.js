const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const db = require('../db');
const { JWT_SECRET } = require('../config');

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Helper to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

// Register (Local)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists
        const existingUser = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userName = name || email.split('@')[0];
        const resDb = await db.query(
            'INSERT INTO users (email, password, name, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [email, hashedPassword, userName, 'local', null]
        );

        const userId = resDb.rows[0].id;
        const newUser = { id: userId, email, name: userName };
        const token = generateToken(newUser);

        res.status(201).json({ token, user: newUser });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login (Local)
router.post('/login', async (req, res) => {
    try {
        const passwordValue = password || req.body.senha;

        if (!email || !passwordValue) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }


        // Check user
        const user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 para não revelar existência
        }

        // CRITICAL FIX: Prevent bcrypt error (500) on social accounts
        if (user.provider === 'google') {
            return res.status(403).json({ error: 'Esta conta usa login com Google. Por favor, use o botão "Continuar com Google".' });
        }
        if (user.provider === 'microsoft') {
            return res.status(403).json({ error: 'Esta conta usa login com Microsoft. Por favor, use o botão "Continuar com Microsoft".' });
        }

        // Check valid details
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }
        } catch (bcryptError) {
            console.error('BCrypt Error for user:', email, bcryptError);
            // Fallback safety
            return res.status(500).json({ error: 'Erro interno ao validar credenciais.' });
        }

        // Create token
        const token = generateToken(user);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Erro interno no servidor via Login.' });
    }
});

// Google Login
// Google Login (GIS - Definitivo)
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential não fornecida.' });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('❌ GOOGLE_CLIENT_ID não definido no ambiente.');
            return res.status(500).json({ error: 'Configuração inválida do servidor.' });
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            console.error('❌ Audience mismatch');
            console.error('Recebido:', payload.aud);
            console.error('Esperado:', process.env.GOOGLE_CLIENT_ID);
            return res.status(401).json({ error: 'Token Google inválido (audience mismatch).' });
        }

        const { email, name, sub: googleId, picture } = payload;

        let user = (await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )).rows[0];

        if (!user) {
            const resDb = await db.query(
                `INSERT INTO users 
                (email, password, name, avatar_url, provider, provider_id)
                VALUES ($1, $2, $3, $4, 'google', $5)
                RETURNING id`,
                [email, 'social_login', name, picture, googleId]
            );

            user = {
                id: resDb.rows[0].id,
                email,
                name,
                avatar_url: picture,
            };
        } else {
            await db.query(
                'UPDATE users SET avatar_url = $1 WHERE id = $2',
                [picture, user.id]
            );
            user.avatar_url = picture;
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
            },
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ error: 'Falha na autenticação com Google.' });
    }
});


// Microsoft Login
router.post('/microsoft', async (req, res) => {
    try {
        const { token } = req.body; // Access Token

        // Verify with Microsoft Graph
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { id: msId, mail, userPrincipalName, displayName } = response.data;
        const email = mail || userPrincipalName;

        if (!email) {
            return res.status(400).json({ error: 'No email found in Microsoft account' });
        }

        let user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];

        if (!user) {
            const resDb = await db.query(
                'INSERT INTO users (email, password, name, provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [email, 'social_login_placeholder', displayName, 'microsoft', msId]
            );

            user = { id: resDb.rows[0].id, email, name: displayName, provider: 'microsoft' };
        } else {
            if (user.provider === 'local') {
                await db.query('UPDATE users SET provider_id = $1 WHERE id = $2', [msId, user.id]);
            }
        }

        const jwtToken = generateToken(user);
        res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name } });

    } catch (error) {
        console.error('Microsoft Auth Error:', error);
        res.status(401).json({ error: 'Microsoft authentication failed' });
    }
});

module.exports = router;
