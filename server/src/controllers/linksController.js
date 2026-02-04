const db = require('../database');

exports.getLinks = (req, res) => {
    try {
        const userId = req.user.id;
        const links = db.prepare('SELECT * FROM custom_links WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        res.json(links);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ error: 'Failed to fetch links' });
    }
};

exports.createLink = (req, res) => {
    try {
        const userId = req.user.id;
        const { title, url, category, icon } = req.body;

        if (!title || !url || !category) {
            return res.status(400).json({ error: 'Title, URL and Category are required' });
        }

        const stmt = db.prepare('INSERT INTO custom_links (user_id, title, url, category, icon) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(userId, title, url, category, icon || 'Link');

        res.status(201).json({ id: info.lastInsertRowid, userId, title, url, category, icon });
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
};

exports.deleteLink = (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = db.prepare('DELETE FROM custom_links WHERE id = ? AND user_id = ?').run(id, userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Link not found or unauthorized' });
        }

        res.json({ message: 'Link deleted' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ error: 'Failed to delete link' });
    }
};
