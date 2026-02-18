const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/events
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM events ORDER BY date ASC');
        // Normalize date to YYYY-MM-DD
        const events = result.rows.map(event => ({
            ...event,
            date: event.date instanceof Date
                ? event.date.toISOString().split('T')[0]
                : event.date
        }));
        res.json(events);
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        res.status(500).json({ error: 'Erro ao buscar eventos' });
    }
});

// POST /api/events
router.post('/', async (req, res) => {
    try {
        const { title, description, date, type, color, period } = req.body;

        if (!title || !date || !type) {
            return res.status(400).json({ error: 'Título, data e tipo são obrigatórios.' });
        }

        const result = await db.query(
            'INSERT INTO events (title, description, date, type, color, period) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, description || '', date, type, color || '#2196F3', period || 'integral']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar evento:', error);
        res.status(500).json({ error: 'Erro ao criar evento' });
    }
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, type, color, period } = req.body;

        const result = await db.query(
            'UPDATE events SET title = $1, description = $2, date = $3, type = $4, color = $5, period = $6 WHERE id = $7 RETURNING *',
            [title, description, date, type, color, period, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar evento:', error);
        res.status(500).json({ error: 'Erro ao atualizar evento' });
    }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM events WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }

        res.json({ message: 'Evento removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover evento:', error);
        res.status(500).json({ error: 'Erro ao remover evento' });
    }
});

module.exports = router;
