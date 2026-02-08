require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./db'); // Refatorado para PostgreSQL

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const linksRoutes = require('./routes/links');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
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

const { processExcelFile } = require('./services/excelProcessor');

// Endpoint de Importação
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('sheet') || file.mimetype.includes('excel') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xlsm')) {
            cb(null, true);
        } else {
            cb(new Error('Formato inválido. Envie apenas arquivos Excel (.xlsx, .xlsm).'));
        }
    }
});

app.post('/api/upload-excel', authMiddleware, upload.single('image'), async (req, res) => {
    // Mantido 'image' por compatibilidade com frontend, mas idealmente seria 'file'
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    // FIX DEFINITIVO: Transação POR AULA + Auto-Criação de Entidades
    // 1. Processar Arquivo (Leitura completa)
    let excelResult;
    try {
        excelResult = await processExcelFile(req.file.path);
    } catch (e) {
        return res.status(400).json({ error: e.message });
    }

    const { lessons, stats: parseStats } = excelResult;

    const stats = {
        totalLines: parseStats.totalRows,
        processed: 0,
        created: 0,
        updated: 0, // Substituídas
        errors: 0,
        details: []
    };

    const savedLessons = [];

    // Mapeamento de Cursos (Hardcoded para robustez inicial, pode virar DB depois)
    const COURSE_MAP = {
        'TI': 'Técnico em Informática',
        'TIPI': 'Técnico em Informática para Internet'
    };

    // 2. Iterar sobre as aulas (UMA TRANSAÇÃO POR LINHA)
    for (const item of lessons) {
        stats.processed++;
        const { date, period, normalized, row, col } = item;

        // Se erro de parse, registra e pula
        if (item.isError) {
            stats.errors++;
            stats.details.push({ row, col, raw: item.raw, error: item.error });
            continue;
        }

        let client = null;
        try {
            // A. Obter Conexão Exclusiva
            client = await db.pool.connect();
            await client.query('BEGIN');

            // --- LÓGICA DE AUTO-CRIAÇÃO (IDEMPOTENTE) ---

            // 1. Resolver CURSO
            const prefix = normalized.turma.split('-')[0] || 'TI';
            let courseName = COURSE_MAP[prefix] || `Curso Importado (${prefix})`;

            let courseRes = await client.query('SELECT id FROM courses WHERE name = $1', [courseName]);
            let courseId;

            if (courseRes.rows.length === 0) {
                const newCourse = await client.query(
                    'INSERT INTO courses (name, acronym) VALUES ($1, $2) RETURNING id',
                    [courseName, prefix]
                );
                courseId = newCourse.rows[0].id;
            } else {
                courseId = courseRes.rows[0].id;
            }

            // 2. Resolver TURMA
            let classRes = await client.query('SELECT id FROM classes WHERE name = $1', [normalized.turma]);

            if (classRes.rows.length === 0) {
                await client.query(
                    'INSERT INTO classes (name, courseid) VALUES ($1, $2)',
                    [normalized.turma, courseId]
                );
            }

            // 3. Resolver UNIDADE CURRICULAR (UC)
            let ucRes = await client.query('SELECT id, name FROM ucs WHERE name = $1 AND courseid = $2', [normalized.uc, courseId]);
            let targetUC;

            if (ucRes.rows.length === 0) {
                const newUC = await client.query(
                    'INSERT INTO ucs (name, courseid, hours) VALUES ($1, $2, $3) RETURNING id, name',
                    [normalized.uc, courseId, 0]
                );
                targetUC = newUC.rows[0];
            } else {
                targetUC = ucRes.rows[0];
            }

            // --- FIM AUTO-CRIAÇÃO ---

            // C. Checagem de Duplicidade (Busca ID para UPDATE ou INSERT)
            const dupCheck = await client.query(
                `SELECT id FROM lessons WHERE date = $1 AND period = $2 AND turma = $3`,
                [date, period, normalized.turma]
            );

            let lessonId;
            let actionType;

            if (dupCheck.rows.length > 0) {
                // UPDATE (Substituição)
                lessonId = dupCheck.rows[0].id;
                await client.query(
                    `UPDATE lessons 
                     SET courseid = $1, ucid = $2, ucname = $3, lab = $4, description = $5
                     WHERE id = $6`,
                    [
                        courseId,
                        targetUC.id,
                        targetUC.name,
                        normalized.lab,
                        'Atualizado via Importação Excel',
                        lessonId
                    ]
                );
                stats.updated++;
                actionType = 'SUBSTITUÍDA';
            } else {
                // INSERT (Criação)
                const insertResult = await client.query(
                    `INSERT INTO lessons (courseid, turma, ucid, ucname, period, lab, date, description)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     RETURNING id`,
                    [
                        courseId,
                        normalized.turma,
                        targetUC.id,
                        targetUC.name,
                        period,
                        normalized.lab,
                        date,
                        'Importado via Excel'
                    ]
                );
                lessonId = insertResult.rows[0].id;
                stats.created++;
                actionType = 'CRIADA';
            }

            // E. Sucesso
            await client.query('COMMIT');

            savedLessons.push({
                id: lessonId,
                date, period,
                turma: normalized.turma,
                uc: targetUC.name,
                lab: normalized.lab,
                status: actionType
            });

        } catch (rowError) {
            // F. Erro Inesperado
            if (client) {
                try { await client.query('ROLLBACK'); } catch (e) { }
            }
            console.error(`Erro na linha ${row}:`, rowError.message);
            stats.errors++;
            stats.details.push({
                row, col, raw: item.raw,
                error: `Erro ao processar: ${rowError.message}`
            });
        } finally {
            if (client) client.release();
        }
    }

    // 4. Retorno Final
    res.json({
        message: 'Importação concluída com sucesso.',
        stats,
        lessons: savedLessons,
        details: stats.details
    });
});

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
