const express = require('express');
const multer = require('multer');
const path = require('path');
const { db, uploadsDir } = require('../db/database');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
  },
});

router.get('/', (_req, res) => {
  const candidates = db.prepare('SELECT * FROM candidates ORDER BY created_at DESC').all();
  res.json(candidates);
});

router.get('/:id', (req, res) => {
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  res.json(candidate);
});

router.post('/', (req, res) => {
  const { name, email, phone, skills } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO candidates (name, email, phone, skills) VALUES (?, ?, ?, ?)'
    ).run(name, email, phone || '', skills || '');

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(candidate);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Candidate with this email already exists' });
    }
    throw err;
  }
});

router.get('/:id/resumes', (req, res) => {
  const candidate = db.prepare('SELECT id FROM candidates WHERE id = ?').get(req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const resumes = db.prepare(
    'SELECT id, candidate_id, file_name, uploaded_at FROM resumes WHERE candidate_id = ? ORDER BY uploaded_at DESC'
  ).all(req.params.id);

  res.json(resumes);
});

router.post('/:id/resume', upload.single('resume'), (req, res) => {
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  if (!req.file) {
    return res.status(400).json({ error: 'Resume file is required (field name: resume)' });
  }

  const result = db.prepare(
    'INSERT INTO resumes (candidate_id, file_name, file_path) VALUES (?, ?, ?)'
  ).run(candidate.id, req.file.originalname, req.file.filename);

  const resume = db.prepare(
    'SELECT id, candidate_id, file_name, uploaded_at FROM resumes WHERE id = ?'
  ).get(result.lastInsertRowid);

  res.status(201).json(resume);
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('files are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
