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
        const { email, password } = req.body;

        // Check user
        const user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (user.provider !== 'local') {
            // Optional: Allow password login even if social?
        }

        // Check valid details
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = generateToken(user);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Google Login
router.post('/google', async (req, res) => {
    try {
        console.log('Google Auth Request Body:', req.body); // DEBUG
        const { token, type } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(501).json({ error: 'Google Login not configured (Missing GOOGLE_CLIENT_ID)' });
        }

        let googleUser = {};
        const isJwt = typeof token === 'string' && token.split('.').length === 3;

        if (type === 'access_token' || !isJwt) {
            // Flow for Custom Button (Access Token)
            console.log('Validating as Access Token...');
            const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Google User Info:', userInfoRes.data); // DEBUG
            googleUser = {
                email: userInfoRes.data.email,
                name: userInfoRes.data.name,
                googleId: userInfoRes.data.sub,
                picture: userInfoRes.data.picture
            };
        } else {
            // Flow for Standard Google Button (ID Token)
            console.log('Validating as ID Token...');
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            console.log('Google ID Token Payload:', payload); // DEBUG
            googleUser = {
                email: payload.email,
                name: payload.name,
                googleId: payload.sub,
                picture: payload.picture
            };
        }

        const { email, name, googleId, picture } = googleUser;

        let user = (await db.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];

        if (!user) {
            // Create user
            const resDb = await db.query(
                'INSERT INTO users (email, password, name, avatar_url, provider, provider_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [email, 'social_login_placeholder', name, picture, 'google', googleId]
            );

            user = { id: resDb.rows[0].id, email, name, avatar_url: picture, provider: 'google' };
        } else {
            // Link account if local or update details
            if (user.provider === 'local') {
                await db.query('UPDATE users SET provider_id = $1, avatar_url = $2 WHERE id = $3', [googleId, picture, user.id]);
            } else if (user.provider === 'google') {
                // Update avatar if changed
                await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [picture, user.id]);
            }
            // Ensure local object has latest avatar
            user.avatar_url = picture;
        }

        const jwtToken = generateToken(user);
        res.json({ token: jwtToken, user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url } });

    } catch (error) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        res.status(401).json({ error: 'Google authentication failed' });
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
