const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const { q, location, job_type, employer_id, status } = req.query;

  let sql = `
    SELECT j.*, e.company, e.name as employer_name
    FROM job_listings j
    JOIN employers e ON e.id = j.employer_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND j.status = ?';
    params.push(status);
  } else {
    sql += " AND j.status = 'open'";
  }

  if (q) {
    sql += ' AND (j.title LIKE ? OR j.description LIKE ?)';
    const term = `%${q}%`;
    params.push(term, term);
  }

  if (location) {
    sql += ' AND j.location LIKE ?';
    params.push(`%${location}%`);
  }

  if (job_type) {
    sql += ' AND j.job_type = ?';
    params.push(job_type);
  }

  if (employer_id) {
    sql += ' AND j.employer_id = ?';
    params.push(employer_id);
  }

  sql += ' ORDER BY j.created_at DESC';

  const jobs = db.prepare(sql).all(...params);
  res.json(jobs);
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, e.company, e.name as employer_name, e.email as employer_email
    FROM job_listings j
    JOIN employers e ON e.id = j.employer_id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.post('/', (req, res) => {
  const { employer_id, title, description, location, job_type, salary_min, salary_max } = req.body;

  if (!employer_id || !title || !description || !location) {
    return res.status(400).json({
      error: 'employer_id, title, description, and location are required',
    });
  }

  const employer = db.prepare('SELECT id FROM employers WHERE id = ?').get(employer_id);
  if (!employer) return res.status(404).json({ error: 'Employer not found' });

  const result = db.prepare(`
    INSERT INTO job_listings (employer_id, title, description, location, job_type, salary_min, salary_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    employer_id,
    title,
    description,
    location,
    job_type || 'full-time',
    salary_min || null,
    salary_max || null
  );

  const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(job);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'closed'];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'status must be open or closed' });
  }

  const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  db.prepare('UPDATE job_listings SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
