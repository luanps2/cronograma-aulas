require('dotenv').config();
const dns = require('dns');

// Fix for Render/Supabase IPv6 connection issues (ENETUNREACH)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Refatorado para PostgreSQL

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const linksRoutes = require('./routes/links');
const uploadRoutes = require('./routes/upload'); // NEW: Dedicated Upload Router
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// Middlewares
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://cronograma-aulas.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Headers for Google Identity Services (GIS)
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/links', authMiddleware, linksRoutes);
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));

// Rotas
app.get('/api/lessons', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM lessons');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar aulas:', error);
        res.status(500).json({ error: 'Erro ao buscar aulas' });
    }
});

app.post('/api/lessons', authMiddleware, async (req, res) => {
    try {
        const { courseId, turma, ucId, period, lab, date, description } = req.body;

        if (!courseId || !ucId) {
            return res.status(400).json({ error: 'Curso e UC são obrigatórios.' });
        }

        // Validação de Hierarquia: A UC pertence a este Curso?
        const uc = (await db.query('SELECT name FROM ucs WHERE id = $1 AND courseId = $2', [ucId, courseId])).rows[0];
        if (!uc) {
            return res.status(400).json({ error: 'Inconsistência: A UC selecionada não pertence ao Curso selecionado.' });
        }

        const result = await db.query(
            'INSERT INTO lessons (courseId, turma, ucId, ucName, period, lab, date, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [courseId, turma, ucId, uc.name, period, lab, date, description]
        );

        res.status(201).json({ id: result.rows[0].id, ...req.body, ucName: uc.name });
    } catch (error) {
        console.error('Erro ao criar aula:', error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/lessons/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { courseId, turma, ucId, period, lab, date, description } = req.body;

        if (!courseId || !ucId) {
            return res.status(400).json({ error: 'Curso e UC são obrigatórios.' });
        }

        const uc = (await db.query('SELECT name FROM ucs WHERE id = $1 AND courseId = $2', [ucId, courseId])).rows[0];
        if (!uc) {
            return res.status(400).json({ error: 'Inconsistência: A UC selecionada não pertence ao Curso selecionado.' });
        }

        await db.query(
            'UPDATE lessons SET courseId = $1, turma = $2, ucId = $3, ucName = $4, period = $5, lab = $6, date = $7, description = $8 WHERE id = $9',
            [courseId, turma, ucId, uc.name, period, lab, date, description, id]
        );

        res.json({ id, ...req.body, ucName: uc.name });
    } catch (error) {
        console.error('Erro ao atualizar aula:', error);
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/lessons/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM lessons WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Aula não encontrada' });
        }

        res.json({ message: 'Aula excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir aula:', error);
        res.status(500).json({ error: error.message });
    }
});

app.use('/api', uploadRoutes); // Mount upload routes (isolated multer)

// Admin: Endpoint para Limpar Mês
app.delete('/api/admin/clear-month', authMiddleware, (req, res) => {
    try {
        const { year, month } = req.body;

        if (!year || !month) {
            return res.status(400).json({ error: 'Ano e Mês são obrigatórios' });
        }

        const dateStr = `${year}-${String(month).padStart(2, '0')}`;

        // PG: to_char(date, 'YYYY-MM')
        // Usando query parametrizada
        db.query("DELETE FROM lessons WHERE to_char(date, 'YYYY-MM') = $1", [dateStr])
            .then(result => {
                res.json({
                    message: `Calendário de ${dateStr} limpo com sucesso`,
                    deletedCount: result.rowCount
                });
            })
            .catch(error => {
                console.error('Erro ao limpar mês:', error);
                res.status(500).json({ error: error.message });
            });
    } catch (error) {
        console.error('Erro ao limpar mês (externo):', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Banco de Dados PostgreSQL conectado (via Pool).');
});
