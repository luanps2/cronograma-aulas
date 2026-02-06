require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./db'); // Refactored to PG

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const linksRoutes = require('./routes/links');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/links', authMiddleware, linksRoutes);
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));

// Routes
app.get('/api/lessons', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM lessons');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Error fetching lessons' });
    }
});

app.post('/api/lessons', authMiddleware, async (req, res) => {
    try {
        const { courseId, turma, ucId, period, lab, date, description } = req.body;

        if (!courseId || !ucId) {
            return res.status(400).json({ error: 'Course and UC are mandatory.' });
        }

        // Validate hierarchy: Does this UC belong to this Course?
        const uc = (await db.query('SELECT name FROM ucs WHERE id = $1 AND courseId = $2', [ucId, courseId])).rows[0];
        if (!uc) {
            return res.status(400).json({ error: 'Inconsistency: Selected UC does not belong to the selected Course.' });
        }

        const result = await db.query(
            'INSERT INTO lessons (courseId, turma, ucId, ucName, period, lab, date, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [courseId, turma, ucId, uc.name, period, lab, date, description]
        );

        res.status(201).json({ id: result.rows[0].id, ...req.body, ucName: uc.name });
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/lessons/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { courseId, turma, ucId, period, lab, date, description } = req.body;

        if (!courseId || !ucId) {
            return res.status(400).json({ error: 'Course and UC are mandatory.' });
        }

        const uc = (await db.query('SELECT name FROM ucs WHERE id = $1 AND courseId = $2', [ucId, courseId])).rows[0];
        if (!uc) {
            return res.status(400).json({ error: 'Inconsistency: Selected UC does not belong to the selected Course.' });
        }

        await db.query(
            'UPDATE lessons SET courseId = $1, turma = $2, ucId = $3, ucName = $4, period = $5, lab = $6, date = $7, description = $8 WHERE id = $9',
            [courseId, turma, ucId, uc.name, period, lab, date, description, id]
        );

        res.json({ id, ...req.body, ucName: uc.name });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/lessons/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM lessons WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({ error: error.message });
    }
});

const { processExcelImage } = require('./services/excelProcessor');

// Import Endpoint
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload-excel', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        // AI returns strictly { aulas: [...] }
        const lessonsData = await processExcelImage(req.file.path);

        const stats = {
            total: lessonsData.length,
            created: 0,
            skipped: 0,
            errors: 0,
            details: []
        };

        const savedLessons = [];

        // Cache basic data for validation (Optimization)
        const allClasses = (await db.query('SELECT * FROM classes')).rows;
        const allUCs = (await db.query('SELECT * FROM ucs')).rows;

        for (const lessonData of lessonsData) {
            // Normalize Data from JSON structure: data, diaSemana, periodo, turma, uc, laboratorio, descricao
            const { turma, uc, laboratorio, periodo, data, descricao } = lessonData;

            // 1. Validate Mandatory Fields
            if (!turma || !uc || !data || !periodo) {
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: 'Dados incompletos (Turma, UC, Data ou Período)' });
                continue;
            }

            // 2. Resolve Class (Turma)
            // Fuzzy search: check if turma in JSON matches DB name or number
            const targetClass = allClasses.find(c =>
                turma.toLowerCase().includes(c.name.toLowerCase()) ||
                c.name.toLowerCase().includes(turma.toLowerCase())
            );

            if (!targetClass) {
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: `Turma desconhecida no sistema: ${turma}` });
                continue;
            }

            // 3. Resolve UC (Unit Curricular)
            // Must belong to the course of the class
            const targetUC = allUCs.find(u =>
                u.courseId === targetClass.courseId &&
                (uc.toLowerCase().includes(u.name.toLowerCase()) || u.name.toLowerCase().includes(uc.toLowerCase()))
            );

            if (!targetUC) {
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: `UC não encontrada para o curso ${targetClass.courseId}: ${uc}` });
                continue;
            }

            // 4. Check Duplication (Data + Period + Turma + UC + Lab)
            const duplicateCheck = await db.query(
                `SELECT id FROM lessons 
                 WHERE date = $1 
                 AND period = $2 
                 AND turma = $3 
                 AND ucId = $4 
                 AND lab = $5`,
                [data, periodo, targetClass.name, targetUC.id, laboratorio || '']
            );

            if (duplicateCheck.rows.length > 0) {
                stats.skipped++;
                stats.details.push({ lesson: lessonData, error: 'Aula duplicada (já existe no banco)' });
                continue;
            }

            // 5. INSERT into Supabase
            try {
                const insertResult = await db.query(
                    `INSERT INTO lessons (courseId, turma, ucId, ucName, period, lab, date, description) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                     RETURNING id`,
                    [
                        targetClass.courseId,
                        targetClass.name,
                        targetUC.id,
                        targetUC.name,
                        periodo,
                        laboratorio || '',
                        data,
                        descricao || ''
                    ]
                );

                if (insertResult.rows[0]?.id) {
                    stats.created++;
                    savedLessons.push({
                        id: insertResult.rows[0].id,
                        date: data,
                        period: periodo,
                        turma: targetClass.name, // Return canonical name
                        uc: targetUC.name,       // Return canonical name
                        lab: laboratorio || '',
                        courseId: targetClass.courseId
                    });
                } else {
                    throw new Error('Database insert returned no ID');
                }
            } catch (dbErr) {
                console.error("DB Insert Error:", dbErr);
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: 'Erro ao salvar no banco de dados' });
            }
        }

        // Final Success Validation
        if (stats.created === 0) {
            return res.status(400).json({
                error: 'Nenhuma aula foi criada no sistema.',
                stats,
                details: stats.details
            });
        }

        res.json({
            message: 'Importação concluída com sucesso',
            stats,
            lessons: savedLessons
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message || 'Falha ao processar imagem' });
    }
});

// Admin: Clear Month Endpoint
app.delete('/api/admin/clear-month', authMiddleware, (req, res) => {
    try {
        const { year, month } = req.body;

        if (!year || !month) {
            return res.status(400).json({ error: 'Year and Month are required' });
        }

        const dateStr = `${year}-${String(month).padStart(2, '0')}`;

        // PG: to_char(date, 'YYYY-MM')
        // Using parameterized query
        db.query("DELETE FROM lessons WHERE to_char(date, 'YYYY-MM') = $1", [dateStr])
            .then(result => {
                res.json({
                    message: `Calendário de ${dateStr} limpo com sucesso`,
                    deletedCount: result.rowCount
                });
            })
            .catch(error => {
                console.error('Error clearing month:', error);
                res.status(500).json({ error: error.message });
            });
    } catch (error) {
        console.error('Error clearing month (outer):', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('PostgreSQL Database connected (via Pool).');
});
