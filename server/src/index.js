require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);

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

        const savedLessons = [];
        const insertStmt = db.prepare(
            'INSERT INTO lessons (courseId, turma, ucId, ucName, period, lab, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );

        for (const lessonData of lessons) {
            // NOTE: This logic is temporary as Excel doesn't provide IDs.
            // Using placeholder ID 1 (Técnico em Informática) and a default ucId for now
            // to prevent crashes, but this should be improved with real mapping.
            const info = insertStmt.run(
                1, // courseId default
                lessonData.turma,
                1, // ucId default
                lessonData.uc || 'UC Desconhecida',
                lessonData.period,
                lessonData.lab,
                lessonData.date,
                lessonData.description || ''
            );
            savedLessons.push({ id: info.lastInsertRowid, ...lessonData });
        }

        res.json({
            message: 'Processing complete',
            lessonsFound: savedLessons
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process image' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('SQLite Database connected and ready.');
});

