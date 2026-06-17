const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const { employer_id, unread_only } = req.query;

  if (!employer_id) {
    return res.status(400).json({ error: 'employer_id query parameter is required' });
  }

  let sql = `
    SELECT n.*, a.status as application_status, j.title as job_title, c.name as candidate_name
    FROM employer_notifications n
    JOIN job_applications a ON a.id = n.application_id
    JOIN job_listings j ON j.id = a.job_id
    JOIN candidates c ON c.id = a.candidate_id
    WHERE n.employer_id = ?
  `;
  const params = [employer_id];

  if (unread_only === 'true') {
    sql += ' AND n.is_read = 0';
  }

  sql += ' ORDER BY n.created_at DESC';

  const notifications = db.prepare(sql).all(...params);
  res.json(notifications);
});

router.patch('/:id/read', (req, res) => {
  const notification = db.prepare('SELECT * FROM employer_notifications WHERE id = ?').get(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  db.prepare('UPDATE employer_notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM employer_notifications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
