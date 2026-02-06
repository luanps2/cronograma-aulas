const express = require('express');
const router = express.Router();
const db = require('../db');

// GET ALL
router.get('/:type', async (req, res) => {
    const { type } = req.params;
    try {
        let items;
        if (type === 'courses') {
            items = (await db.query('SELECT * FROM courses')).rows;
        } else if (type === 'classes') {
            items = (await db.query(`
                SELECT classes.*, courses.name as "courseName", courses.acronym as "courseAcronym" 
                FROM classes 
                LEFT JOIN courses ON classes.courseId = courses.id
            `)).rows;
            // Format to match frontend expectation (nested object)
            items = items.map(item => ({
                _id: item.id,
                ...item,
                course: { id: item.courseId, name: item.courseName, acronym: item.courseAcronym }
            }));
        } else if (type === 'ucs') {
            // By default, return all ucs formatted if needed
            items = (await db.query(`
                SELECT ucs.*, courses.name as "courseName", courses.acronym as "courseAcronym" 
                FROM ucs 
                LEFT JOIN courses ON ucs.courseId = courses.id
            `)).rows;
            // Format to match frontend expectation
            items = items.map(item => ({
                _id: item.id,
                ...item,
                course: { id: item.courseId, name: item.courseName, acronym: item.courseAcronym }
            }));
        } else if (type === 'labs') {
            items = (await db.query('SELECT * FROM labs')).rows;
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
router.get('/courses/:id/ucs', async (req, res) => {
    try {
        const ucs = (await db.query(`
            SELECT ucs.*, courses.name as "courseName", courses.acronym as "courseAcronym" 
            FROM ucs 
            JOIN courses ON ucs.courseId = courses.id
            WHERE ucs.courseId = $1
        `, [req.params.id])).rows;

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
router.post('/:type', async (req, res) => {
    const { type } = req.params;
    const data = req.body;

    try {
        let result;
        if (type === 'courses') {
            if (!data.name || !data.acronym) return res.status(400).json({ error: 'Name and Acronym required' });

            // Check uniqueness
            const existing = (await db.query('SELECT * FROM courses WHERE acronym = $1', [data.acronym])).rows[0];
            if (existing) return res.status(400).json({ error: 'Acronym already exists' });

            result = await db.query('INSERT INTO courses (name, acronym) VALUES ($1, $2) RETURNING id', [data.name, data.acronym]);
        } else if (type === 'classes') {
            const courseId = data.courseId || data.course;
            if (!courseId) return res.status(400).json({ error: 'Course ID is mandatory for Classes' });

            const course = (await db.query('SELECT * FROM courses WHERE id = $1', [courseId])).rows[0];
            if (!course) return res.status(404).json({ error: 'Course not found' });

            const className = `${course.acronym} - ${data.number}`;
            result = await db.query('INSERT INTO classes (name, number, courseId, year) VALUES ($1, $2, $3, $4) RETURNING id', [
                className, data.number, courseId, data.year || ''
            ]);
        } else if (type === 'ucs') {
            const courseId = data.courseId || data.course;
            if (!courseId) return res.status(400).json({ error: 'Course ID is mandatory for UCs' });
            // Validate course exists
            const course = (await db.query('SELECT id FROM courses WHERE id = $1', [courseId])).rows[0];
            if (!course) return res.status(400).json({ error: 'Invalid Course ID' });

            result = await db.query('INSERT INTO ucs (name, "desc", hours, courseId) VALUES ($1, $2, $3, $4) RETURNING id', [
                data.name, data.desc, data.hours, courseId
            ]);
        } else if (type === 'labs') {
            result = await db.query('INSERT INTO labs (name, capacity) VALUES ($1, $2) RETURNING id', [data.name, data.capacity]);
        } else {
            return res.status(404).json({ error: 'Invalid type' });
        }

        const id = result.rows[0].id;
        res.status(201).json({ _id: id, ...data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE
router.delete('/:type/:id', async (req, res) => {
    const { type, id } = req.params;

    try {
        if (type === 'courses') {
            const hasUCs = (await db.query('SELECT 1 FROM ucs WHERE courseId = $1', [id])).rows[0];
            const hasClasses = (await db.query('SELECT 1 FROM classes WHERE courseId = $1', [id])).rows[0];
            if (hasUCs || hasClasses) {
                return res.status(400).json({ error: 'Cannot delete Course with registered UCs or Classes.' });
            }
            await db.query('DELETE FROM courses WHERE id = $1', [id]);
        } else if (type === 'classes') {
            await db.query('DELETE FROM classes WHERE id = $1', [id]);
        } else if (type === 'ucs') {
            await db.query('DELETE FROM ucs WHERE id = $1', [id]);
        } else if (type === 'labs') {
            await db.query('DELETE FROM labs WHERE id = $1', [id]);
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
router.put('/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const data = req.body;

    try {
        if (type === 'courses') {
            await db.query('UPDATE courses SET name = $1, acronym = $2 WHERE id = $3', [data.name, data.acronym, id]);
        } else if (type === 'classes') {
            const courseId = data.courseId || data.course;
            const course = (await db.query('SELECT acronym FROM courses WHERE id = $1', [courseId])).rows[0];
            const className = `${course.acronym} - ${data.number}`;
            await db.query('UPDATE classes SET name = $1, number = $2, courseId = $3, year = $4 WHERE id = $5', [
                className, data.number, courseId, data.year || '', id
            ]);
        } else if (type === 'ucs') {
            const courseId = data.courseId || data.course;
            await db.query('UPDATE ucs SET name = $1, "desc" = $2, hours = $3, courseId = $4 WHERE id = $5', [
                data.name, data.desc, data.hours, courseId, id
            ]);
        } else if (type === 'labs') {
            await db.query('UPDATE labs SET name = $1, capacity = $2 WHERE id = $3', [data.name, data.capacity, id]);
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
