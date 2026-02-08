const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // 1. KPIs
        const totalCourses = (await db.query('SELECT COUNT(*) FROM courses')).rows[0].count;
        const totalClasses = (await db.query('SELECT COUNT(*) FROM classes')).rows[0].count;
        const totalUCs = (await db.query('SELECT COUNT(*) FROM ucs')).rows[0].count;
        const totalLessons = (await db.query('SELECT COUNT(*) FROM lessons')).rows[0].count;
        const totalUsers = (await db.query('SELECT COUNT(*) FROM users')).rows[0].count;

        // 2. Charts Data

        // Lessons by Period
        const lessonsByPeriod = (await db.query(`
            SELECT period, COUNT(*) as count 
            FROM lessons 
            GROUP BY period
        `)).rows;

        // Lessons by Month (Current Year default, or simplified)
        // Using to_char for postgres
        const lessonsByMonth = (await db.query(`
            SELECT to_char(date, 'YYYY-MM') as month, COUNT(*) as count
            FROM lessons
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        `)).rows;

        // Lessons by Lab (Top 5)
        const lessonsByLab = (await db.query(`
            SELECT lab, COUNT(*) as count
            FROM lessons
            GROUP BY lab
            ORDER BY count DESC
            LIMIT 5
        `)).rows;

        // Top Courses by Lessons
        const topCourses = (await db.query(`
            SELECT c.name, COUNT(l.id) as count
            FROM courses c
            JOIN lessons l ON c.id = l.courseId
            GROUP BY c.name
            ORDER BY count DESC
            LIMIT 5
        `)).rows;

        // 3. Recent Activity
        const recentActivity = (await db.query(`
            SELECT id, date, turma, ucName, description
            FROM lessons
            ORDER BY id DESC
            LIMIT 5
        `)).rows;

        res.json({
            kpis: {
                courses: parseInt(totalCourses),
                classes: parseInt(totalClasses),
                ucs: parseInt(totalUCs),
                lessons: parseInt(totalLessons),
                users: parseInt(totalUsers)
            },
            charts: {
                byPeriod: lessonsByPeriod,
                byMonth: lessonsByMonth,
                byLab: lessonsByLab,
                topCourses: topCourses
            },
            recentActivity
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// GET /api/dashboard/monthly-stats?month=X&year=Y
router.get('/monthly-stats', async (req, res) => {
    try {
        const { month, year } = req.query;

        console.log(`Fetching monthly stats for ${month}/${year}`);

        if (!month || !year) {
            return res.status(400).json({ error: 'Month and Year are required' });
        }

        // Ensure month is 0-indexed or 1-indexed? Javascript Date is 0-indexed.
        // Let's assume input is 1-12 (human readable) for API ease.
        // Postgres to_char(date, 'MM') returns '01'-'12'.
        // Let's stick to strict ISO date filtering.

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        // Calculate end date (end of month)
        // We can just filter by EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2

        const lessons = (await db.query(`
            SELECT * FROM lessons 
            WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
        `, [month, year])).rows;

        // Calculate Stats
        const totalLessons = lessons.length;

        const byPeriod = {
            'Manhã': 0,
            'Tarde': 0,
            'Noite': 0
        };

        const byCourse = {};
        const byClass = {};
        const byUC = {};

        lessons.forEach(lesson => {
            // Period
            if (byPeriod[lesson.period] !== undefined) {
                byPeriod[lesson.period]++;
            } else {
                // Handle variance if any
                byPeriod[lesson.period] = (byPeriod[lesson.period] || 0) + 1;
            }

            // Course (we assume course name is available or we need join? Lesson table has courseId usually, looking at previous queries it seems 'ucName' is there?)
            // Looking at dashboard.js: "SELECT id, date, turma, ucName, description FROM lessons"
            // It seems 'turma' is the Class.
            // Let's aggregate by 'turma' (Class) and 'uc' (UC).

            if (lesson.turma) {
                byClass[lesson.turma] = (byClass[lesson.turma] || 0) + 1;
            }
            if (lesson.uc) {
                byUC[lesson.uc] = (byUC[lesson.uc] || 0) + 1;
            }
        });

        res.json({
            total: totalLessons,
            byPeriod,
            byClass,
            byUC
        });

    } catch (error) {
        console.error('Error fetching monthly stats:', error);
        res.status(500).json({ error: 'Failed to fetch monthly statistics' });
    }
});

module.exports = router;
