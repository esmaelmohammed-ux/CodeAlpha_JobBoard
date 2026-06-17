const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (_req, res) => {
  const employers = db.prepare('SELECT * FROM employers ORDER BY created_at DESC').all();
  res.json(employers);
});

router.get('/:id', (req, res) => {
  const employer = db.prepare('SELECT * FROM employers WHERE id = ?').get(req.params.id);
  if (!employer) return res.status(404).json({ error: 'Employer not found' });
  res.json(employer);
});

router.post('/', (req, res) => {
  const { name, email, company, phone } = req.body;

  if (!name || !email || !company) {
    return res.status(400).json({ error: 'name, email, and company are required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO employers (name, email, company, phone) VALUES (?, ?, ?, ?)'
    ).run(name, email, company, phone || '');

    const employer = db.prepare('SELECT * FROM employers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(employer);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Employer with this email already exists' });
    }
    throw err;
  }
});

module.exports = router;
