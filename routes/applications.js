const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

function getApplicationById(id) {
  return db.prepare(`
    SELECT a.*,
      j.title as job_title,
      j.location,
      e.company,
      c.name as candidate_name,
      c.email as candidate_email,
      r.file_name as resume_file
    FROM job_applications a
    JOIN job_listings j ON j.id = a.job_id
    JOIN employers e ON e.id = j.employer_id
    JOIN candidates c ON c.id = a.candidate_id
    LEFT JOIN resumes r ON r.id = a.resume_id
    WHERE a.id = ?
  `).get(id);
}

router.get('/', (req, res) => {
  const { candidate_id, job_id, employer_id, status } = req.query;

  if (!candidate_id && !job_id && !employer_id) {
    return res.status(400).json({
      error: 'Provide at least one filter: candidate_id, job_id, or employer_id',
    });
  }

  let sql = `
    SELECT a.*,
      j.title as job_title,
      j.location,
      e.company,
      c.name as candidate_name,
      c.email as candidate_email,
      r.file_name as resume_file
    FROM job_applications a
    JOIN job_listings j ON j.id = a.job_id
    JOIN employers e ON e.id = j.employer_id
    JOIN candidates c ON c.id = a.candidate_id
    LEFT JOIN resumes r ON r.id = a.resume_id
    WHERE 1=1
  `;
  const params = [];

  if (candidate_id) {
    sql += ' AND a.candidate_id = ?';
    params.push(candidate_id);
  }
  if (job_id) {
    sql += ' AND a.job_id = ?';
    params.push(job_id);
  }
  if (employer_id) {
    sql += ' AND j.employer_id = ?';
    params.push(employer_id);
  }
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/jobs/:jobId/apply', (req, res) => {
  const jobId = req.params.jobId;
  const { candidate_id, resume_id, cover_letter } = req.body;

  if (!candidate_id) {
    return res.status(400).json({ error: 'candidate_id is required' });
  }

  const job = db.prepare('SELECT * FROM job_listings WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'open') {
    return res.status(409).json({ error: 'This job is no longer accepting applications' });
  }

  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidate_id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  if (resume_id) {
    const resume = db.prepare(
      'SELECT * FROM resumes WHERE id = ? AND candidate_id = ?'
    ).get(resume_id, candidate_id);
    if (!resume) return res.status(404).json({ error: 'Resume not found for this candidate' });
  }

  const existing = db.prepare(
    'SELECT id FROM job_applications WHERE job_id = ? AND candidate_id = ?'
  ).get(jobId, candidate_id);

  if (existing) {
    return res.status(409).json({ error: 'You have already applied for this job' });
  }

  const applicationId = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO job_applications (job_id, candidate_id, resume_id, cover_letter)
      VALUES (?, ?, ?, ?)
    `).run(jobId, candidate_id, resume_id || null, cover_letter || '');

    const id = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO employer_notifications (employer_id, application_id, message)
      VALUES (?, ?, ?)
    `).run(
      job.employer_id,
      id,
      `New application from ${candidate.name} for "${job.title}"`
    );

    return id;
  })();

  res.status(201).json(getApplicationById(applicationId));
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired'];

  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
  }

  const application = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });

  db.prepare(`
    UPDATE job_applications SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(status, req.params.id);

  res.json(getApplicationById(req.params.id));
});

module.exports = router;
