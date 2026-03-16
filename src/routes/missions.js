const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all missions, optional filter by status
router.get('/', (req, res) => {
  const { filter, category } = req.query;
  let query = 'SELECT * FROM missions WHERE 1=1';
  const params = [];

  if (filter && filter !== 'all') {
    query += ' AND status = ?';
    params.push(filter);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ` ORDER BY CASE status WHEN 'tracked' THEN 0 WHEN 'active' THEN 1 WHEN 'completed' THEN 2 WHEN 'failed' THEN 3 END, CASE priority WHEN 'very_high' THEN 0 WHEN 'high' THEN 1 WHEN 'moderate' THEN 2 WHEN 'low' THEN 3 WHEN 'very_low' THEN 4 END, created_at DESC`;

  const missions = db.prepare(query).all(...params);
  res.json(missions);
});

// POST create mission
router.post('/', (req, res) => {
  const { name, category, priority } = req.body;

  if (!name || !category || !priority) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const validCategories = ['main', 'side', 'gig'];
  const validPriorities = ['very_low', 'low', 'moderate', 'high', 'very_high'];

  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  const stmt = db.prepare('INSERT INTO missions (name, category, priority) VALUES (?, ?, ?)');
  const result = stmt.run(name.trim(), category, priority);
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(mission);
});

// PATCH update mission status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'tracked', 'completed', 'failed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const stmt = db.prepare('UPDATE missions SET status = ? WHERE id = ?');
  const result = stmt.run(status, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id);
  res.json(mission);
});

// DELETE mission
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM missions WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  res.json({ success: true });
});

module.exports = router;
