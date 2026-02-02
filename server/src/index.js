require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Routes
app.get('/api/lessons', (req, res) => {
    try {
        const lessons = db.prepare('SELECT * FROM lessons').all();
        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Error fetching lessons' });
    }
});

app.post('/api/lessons', (req, res) => {
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

const { processExcelImage } = require('./services/excelProcessor');

// Import Endpoint
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload-excel', upload.single('image'), async (req, res) => {
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
        res.status(500).json({ error: 'Failed to process image' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('SQLite Database connected and ready.');
});

