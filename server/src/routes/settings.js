const express = require('express');
const router = express.Router();
const db = require('../database');

// GET ALL
router.get('/:type', (req, res) => {
    const { type } = req.params;
    try {
        let items;
        if (type === 'courses') {
            items = db.prepare('SELECT * FROM courses').all();
        } else if (type === 'classes') {
            items = db.prepare(`
                SELECT classes.*, courses.name as courseName, courses.acronym as courseAcronym 
                FROM classes 
                LEFT JOIN courses ON classes.courseId = courses.id
            `).all();
            // Format to match frontend expectation (nested object)
            items = items.map(item => ({
                _id: item.id,
                ...item,
                course: { id: item.courseId, name: item.courseName, acronym: item.courseAcronym }
            }));
        } else if (type === 'ucs') {
            // By default, return all ucs formatted if needed, but we'll use the filtered one more
            items = db.prepare(`
                SELECT ucs.*, courses.name as courseName, courses.acronym as courseAcronym 
                FROM ucs 
                LEFT JOIN courses ON ucs.courseId = courses.id
            `).all();
            // Format to match frontend expectation
            items = items.map(item => ({
                _id: item.id,
                ...item,
                course: { id: item.courseId, name: item.courseName, acronym: item.courseAcronym }
            }));
        } else if (type === 'labs') {
            items = db.prepare('SELECT * FROM labs').all();
        } else {
            return res.status(404).json({ error: 'Invalid type' });
        }

        // Map id to _id for frontend compatibility if needed
        const formattedItems = items.map(item => ({
            ...item,
            _id: item.id || item._id
        }));

        res.json(formattedItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET UCs BY COURSE
router.get('/courses/:id/ucs', (req, res) => {
    try {
        const ucs = db.prepare(`
            SELECT ucs.*, courses.name as courseName, courses.acronym as courseAcronym 
            FROM ucs 
            JOIN courses ON ucs.courseId = courses.id
            WHERE ucs.courseId = ?
        `).all(req.params.id);

        const formatted = ucs.map(item => ({
            ...item,
            _id: item.id,
            course: { id: item.courseId, name: item.courseName, acronym: item.courseAcronym }
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
router.post('/:type', (req, res) => {
    const { type } = req.params;
    const data = req.body;

    try {
        let info;
        if (type === 'courses') {
            if (!data.name || !data.acronym) return res.status(400).json({ error: 'Name and Acronym required' });

            // Check uniqueness
            const existing = db.prepare('SELECT * FROM courses WHERE acronym = ?').get(data.acronym);
            if (existing) return res.status(400).json({ error: 'Acronym already exists' });

            info = db.prepare('INSERT INTO courses (name, acronym) VALUES (?, ?)').run(data.name, data.acronym);
        } else if (type === 'classes') {
            const courseId = data.courseId || data.course;
            if (!courseId) return res.status(400).json({ error: 'Course ID is mandatory for Classes' });

            const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
            if (!course) return res.status(404).json({ error: 'Course not found' });

            const className = `${course.acronym} - ${data.number}`;
            info = db.prepare('INSERT INTO classes (name, number, courseId, year) VALUES (?, ?, ?, ?)').run(
                className, data.number, courseId, data.year || ''
            );
        } else if (type === 'ucs') {
            const courseId = data.courseId || data.course;
            if (!courseId) return res.status(400).json({ error: 'Course ID is mandatory for UCs' });
            // Validate course exists
            const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
            if (!course) return res.status(400).json({ error: 'Invalid Course ID' });

            info = db.prepare('INSERT INTO ucs (name, desc, hours, courseId) VALUES (?, ?, ?, ?)').run(
                data.name, data.desc, data.hours, courseId
            );
        } else if (type === 'labs') {
            info = db.prepare('INSERT INTO labs (name, capacity) VALUES (?, ?)').run(data.name, data.capacity);
        } else {
            return res.status(404).json({ error: 'Invalid type' });
        }

        res.status(201).json({ _id: info.lastInsertRowid, ...data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE
router.delete('/:type/:id', (req, res) => {
    const { type, id } = req.params;

    try {
        if (type === 'courses') {
            const hasUCs = db.prepare('SELECT 1 FROM ucs WHERE courseId = ?').get(id);
            const hasClasses = db.prepare('SELECT 1 FROM classes WHERE courseId = ?').get(id);
            if (hasUCs || hasClasses) {
                return res.status(400).json({ error: 'Cannot delete Course with registered UCs or Classes.' });
            }
            db.prepare('DELETE FROM courses WHERE id = ?').run(id);
        } else if (type === 'classes') {
            db.prepare('DELETE FROM classes WHERE id = ?').run(id);
        } else if (type === 'ucs') {
            db.prepare('DELETE FROM ucs WHERE id = ?').run(id);
        } else if (type === 'labs') {
            db.prepare('DELETE FROM labs WHERE id = ?').run(id);
        } else {
            return res.status(404).json({ error: 'Invalid type' });
        }

        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
router.put('/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const data = req.body;

    try {
        if (type === 'courses') {
            db.prepare('UPDATE courses SET name = ?, acronym = ? WHERE id = ?').run(data.name, data.acronym, id);
        } else if (type === 'classes') {
            const courseId = data.courseId || data.course;
            const course = db.prepare('SELECT acronym FROM courses WHERE id = ?').get(courseId);
            const className = `${course.acronym} - ${data.number}`;
            db.prepare('UPDATE classes SET name = ?, number = ?, courseId = ?, year = ? WHERE id = ?').run(
                className, data.number, courseId, data.year || '', id
            );
        } else if (type === 'ucs') {
            const courseId = data.courseId || data.course;
            db.prepare('UPDATE ucs SET name = ?, desc = ?, hours = ?, courseId = ? WHERE id = ?').run(
                data.name, data.desc, data.hours, courseId, id
            );
        } else if (type === 'labs') {
            db.prepare('UPDATE labs SET name = ?, capacity = ? WHERE id = ?').run(data.name, data.capacity, id);
        } else {
            return res.status(404).json({ error: 'Invalid type' });
        }
        res.json({ message: 'Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


