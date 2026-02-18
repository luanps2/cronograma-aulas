const express = require('express');
const multer = require('multer');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { processExcelFile } = require('../services/excelProcessor');

const router = express.Router();

// Configuração do Multer (Movido do index.js)
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

// Endpoint de Importação (Movido do index.js)
router.post('/upload-excel', authMiddleware, upload.single('image'), async (req, res) => {
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
            // A. Obter Conexão Exclusiva (db.pool é async getPool())
            const poolInstance = await db.pool();
            client = await poolInstance.connect();
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

            // 2. Resolver TURMA (NORMALIZAÇÃO ROBUSTA)
            // Função de normalização exigida
            const normalizeClassName = (name) => {
                return name
                    .toUpperCase()
                    .trim()
                    .replace(/\s*-\s*/g, '-') // "TI - 27" -> "TI-27"
                    .replace(/\s+/g, '');     // Remove espaços extras
            };

            const inputClassNameNormalized = normalizeClassName(normalized.turma);

            // CRITICAL FIX: Ensure clean name is used everywhere (lessons table stores string)
            normalized.turma = inputClassNameNormalized;

            // Buscar todas as turmas deste curso para comparação segura
            const existingClassesRes = await client.query('SELECT id, name FROM classes WHERE courseid = $1', [courseId]);
            let classId = null;

            // Verificar se já existe alguma turma que, normalizada, seja igual à entrada
            const foundClass = existingClassesRes.rows.find(cls => normalizeClassName(cls.name) === inputClassNameNormalized);

            if (foundClass) {
                // Reutiliza existente
                classId = foundClass.id;
                // Opcional: Se quiser atualizar o nome no banco para o padrão normalizado, faria aqui. 
                // Por segurança e simplicidade (Regra 4 - Não quebrar existentes), apenas reutilizamos.
            } else {
                // Cria nova já normalizada com formatação visual agradável (Espaço antes/depois do hífen se preferir, ou estrito)
                // O usuario pediu: "TI-27" (sem espaços) como padrão.
                // A função normalizeClassName remove espaços. Vamos usar o resultado dela.
                const newClass = await client.query(
                    'INSERT INTO classes (name, courseid) VALUES ($1, $2) RETURNING id',
                    [inputClassNameNormalized, courseId]
                );
                classId = newClass.rows[0].id;
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

module.exports = router;
