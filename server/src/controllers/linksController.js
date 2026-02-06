const db = require('../db');

exports.getLinks = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT * FROM custom_links WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
};

exports.createLink = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, url, category, icon } = req.body;

        if (!title || !url || !category) {
            return res.status(400).json({ error: 'Title, URL and Category are required' });
        }

        const result = await db.query(
            'INSERT INTO custom_links (user_id, title, url, category, icon) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, title, url, category, icon || 'Link']
        );
        const id = result.rows[0].id;

        res.status(201).json({ id, userId, title, url, category, icon });
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
};

exports.deleteLink = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await db.query('DELETE FROM custom_links WHERE id = $1 AND user_id = $2', [id, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Link not found or unauthorized' });
        }

        res.json({ message: 'Link deleted' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
};
