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

module.exports = router;
