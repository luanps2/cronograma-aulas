require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database');

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

// Routes
app.get('/api/lessons', authMiddleware, (req, res) => {
    try {
        const lessons = db.prepare('SELECT * FROM lessons').all();
        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Error fetching lessons' });
    }
});

app.post('/api/lessons', authMiddleware, (req, res) => {
    try {
        const { courseId, turma, ucId, period, lab, date, description } = req.body;

        if (!courseId || !ucId) {
            return res.status(400).json({ error: 'Course and UC are mandatory.' });
        }

        // Validate hierarchy: Does this UC belong to this Course?
        const uc = db.prepare('SELECT name FROM ucs WHERE id = ? AND courseId = ?').get(ucId, courseId);
        if (!uc) {
            return res.status(400).json({ error: 'Inconsistency: Selected UC does not belong to the selected Course.' });
        }

        const info = db.prepare(
            'INSERT INTO lessons (courseId, turma, ucId, ucName, period, lab, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(courseId, turma, ucId, uc.name, period, lab, date, description);

        res.status(201).json({ id: info.lastInsertRowid, ...req.body, ucName: uc.name });
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/lessons/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { courseId, turma, ucId, period, lab, date, description } = req.body;

        if (!courseId || !ucId) {
            return res.status(400).json({ error: 'Course and UC are mandatory.' });
        }

        const uc = db.prepare('SELECT name FROM ucs WHERE id = ? AND courseId = ?').get(ucId, courseId);
        if (!uc) {
            return res.status(400).json({ error: 'Inconsistency: Selected UC does not belong to the selected Course.' });
        }

        db.prepare(
            'UPDATE lessons SET courseId = ?, turma = ?, ucId = ?, ucName = ?, period = ?, lab = ?, date = ?, description = ? WHERE id = ?'
        ).run(courseId, turma, ucId, uc.name, period, lab, date, description, id);

        res.json({ id, ...req.body, ucName: uc.name });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/lessons/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM lessons WHERE id = ?').run(id);

        if (result.changes === 0) {
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
        const lessons = await processExcelImage(req.file.path);

        const stats = {
            total: lessons.length,
            created: 0,
            skipped: 0,
            errors: 0,
            details: []
        };

        const savedLessons = [];
        const checkDupStmt = db.prepare('SELECT id FROM lessons WHERE date = ? AND period = ? AND turma = ? AND ucId = ? AND lab = ?');
        const insertStmt = db.prepare(
            'INSERT INTO lessons (courseId, turma, ucId, ucName, period, lab, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        const findClassStmt = db.prepare('SELECT * FROM classes WHERE name LIKE ? OR number = ?');
        const findUCStmt = db.prepare('SELECT * FROM ucs WHERE courseId = ? AND (name LIKE ? OR desc LIKE ?)');

        const findMostSimilarClass = (inputName) => {
            // Simple robust search: try exact, then contains
            let cls = findClassStmt.get(inputName, inputName);
            if (!cls) {
                // Try searching by part if "TI 31 - ..."
                const parts = inputName.split(' ');
                if (parts.length > 1) {
                    // Try "TI 31" or "31"
                    cls = findClassStmt.get(inputName, parts[parts.length - 1]);
                }
            }
            return cls;
        };

        for (const lessonData of lessons) {
            // 1. Validate mandatory fields
            if (!lessonData.turma || !lessonData.uc || !lessonData.date || !lessonData.period) {
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: 'Dados incompletos (Turma, UC, Data ou Período)' });
                continue;
            }

            // 2. Resolve Class & Course
            const cls = findMostSimilarClass(lessonData.turma);
            if (!cls) {
                // If strict mode, abort. Or try to find by fuzzy matching entire classes table?
                // For now, strict on DB lookup but flexible on query
                const allClasses = db.prepare('SELECT * FROM classes').all();
                const fuzzyMatch = allClasses.find(c => lessonData.turma.includes(c.name) || lessonData.turma.includes(c.number));

                if (!fuzzyMatch) {
                    stats.errors++;
                    stats.details.push({ lesson: lessonData, error: `Turma não encontrada: ${lessonData.turma}` });
                    continue;
                }
                // Use found match
                // cls = fuzzyMatch; -> Const assignment error if I reused variable, but I didn't declare cls as let yet.
                // Refactoring to be cleaner.
            }

            // Re-evaluating variable scope inside loop
            let targetClass = cls;
            if (!targetClass) {
                const allClasses = db.prepare('SELECT * FROM classes').all();
                targetClass = allClasses.find(c => lessonData.turma.includes(c.name) || lessonData.turma.includes(c.number));
            }

            if (!targetClass) {
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: `Turma desconhecida: ${lessonData.turma}` });
                continue;
            }

            const courseId = targetClass.courseId;

            // 3. Resolve UC
            // Try precise match first, then fuzzy
            let targetUC = findUCStmt.get(courseId, lessonData.uc, `%${lessonData.uc}%`);

            if (!targetUC) {
                // Try harder to find UC: split string "UC12 - Hardware" -> "UC12"
                const ucParts = lessonData.uc.split(/[ -]/);
                for (const part of ucParts) {
                    if (part.length > 2) {
                        targetUC = findUCStmt.get(courseId, part, `%${part}%`);
                        if (targetUC) break;
                    }
                }
            }

            if (!targetUC) {
                // Try getting all UCs for course and seeing if any match
                const courseUCs = db.prepare('SELECT * FROM ucs WHERE courseId = ?').all(courseId);
                targetUC = courseUCs.find(u => lessonData.uc.toLowerCase().includes(u.name.toLowerCase()) || lessonData.uc.toLowerCase().includes(u.desc.toLowerCase()));
            }

            if (!targetUC) {
                stats.errors++;
                stats.details.push({ lesson: lessonData, error: `UC não encontrada no curso ${courseId}: ${lessonData.uc}` });
                continue;
            }

            // 4. Check Duplication
            const exists = checkDupStmt.get(lessonData.date, lessonData.period, lessonData.turma, targetUC.id, lessonData.lab);
            if (exists) {
                stats.skipped++;
                stats.details.push({ lesson: lessonData, reason: 'Aula duplicada ignorada' });
                continue;
            }

            // 5. Insert
            const info = insertStmt.run(
                courseId,
                targetClass.name, // Ensure consistent formatting matches class name not input
                targetUC.id,
                targetUC.name,
                lessonData.period,
                lessonData.lab,
                lessonData.date,
                lessonData.description || ''
            );

            stats.created++;
            savedLessons.push({ id: info.lastInsertRowid, ...lessonData, courseId, ucId: targetUC.id });
        }

        res.json({
            message: 'Importação concluída',
            stats,
            lessonsFound: savedLessons
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process image' });
    }
});

// Admin: Clear Month Endpoint
app.delete('/api/lessons/clear-month', authMiddleware, (req, res) => {
    try {
        const { year, month } = req.body; // Expects numbers: year=2026, month=3 (1-12) or month=2 (0-11)? Let's assume 1-based index like 2026-03

        if (!year || !month) {
            return res.status(400).json({ error: 'Year and Month are required' });
        }

        const dateStr = `${year}-${String(month).padStart(2, '0')}`;

        // Delete all lessons where date starts with YYYY-MM
        const result = db.prepare("DELETE FROM lessons WHERE strftime('%Y-%m', date) = ?").run(dateStr);

        res.json({
            message: `Calendário de ${dateStr} limpo com sucesso`,
            deletedCount: result.changes
        });
    } catch (error) {
        console.error('Error clearing month:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('SQLite Database connected and ready.');
});

