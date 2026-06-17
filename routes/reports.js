const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.get('/stats', (_req, res) => {
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM employers) as total_employers,
      (SELECT COUNT(*) FROM candidates) as total_candidates,
      (SELECT COUNT(*) FROM job_listings WHERE status = 'open') as open_jobs,
      (SELECT COUNT(*) FROM job_applications) as total_applications
  `).get();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM job_applications
    GROUP BY status
  `).all();

  const topJobs = db.prepare(`
    SELECT j.id, j.title, e.company, COUNT(a.id) as application_count
    FROM job_listings j
    JOIN employers e ON e.id = j.employer_id
    LEFT JOIN job_applications a ON a.job_id = j.id
    GROUP BY j.id
    ORDER BY application_count DESC
    LIMIT 5
  `).all();

  res.json({
    totals,
    applications_by_status: byStatus,
    top_jobs_by_applications: topJobs,
  });
});

module.exports = router;
