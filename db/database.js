const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const uploadsDir = path.join(__dirname, '..', 'uploads');

[dataDir, uploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const db = new Database(path.join(dataDir, 'jobboard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS employers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company TEXT NOT NULL,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'full-time',
    salary_min REAL,
    salary_max REAL,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    skills TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    resume_id INTEGER,
    cover_letter TEXT,
    status TEXT DEFAULT 'submitted',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    UNIQUE(job_id, candidate_id)
  );

  CREATE TABLE IF NOT EXISTS employer_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    application_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE
  );
`);

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as count FROM employers').get().count;
  if (count > 0) return;

  const insertEmployer = db.prepare(
    'INSERT INTO employers (name, email, company, phone) VALUES (?, ?, ?, ?)'
  );
  const emp1 = insertEmployer.run('Sarah Chen', 'sarah@techcorp.com', 'TechCorp', '9000000001').lastInsertRowid;
  const emp2 = insertEmployer.run('Raj Patel', 'raj@startup.io', 'StartupIO', '9000000002').lastInsertRowid;

  const insertJob = db.prepare(`
    INSERT INTO job_listings (employer_id, title, description, location, job_type, salary_min, salary_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertJob.run(
    emp1,
    'Backend Developer',
    'Build scalable REST APIs using Node.js and databases.',
    'Bangalore',
    'full-time',
    800000,
    1200000
  );
  insertJob.run(
    emp1,
    'DevOps Engineer',
    'Manage CI/CD pipelines and cloud infrastructure on AWS.',
    'Remote',
    'remote',
    900000,
    1400000
  );
  insertJob.run(
    emp2,
    'Frontend Intern',
    'Work on React-based dashboards with a mentor.',
    'Mumbai',
    'internship',
    15000,
    25000
  );

  db.prepare(`
    INSERT INTO candidates (name, email, phone, skills)
    VALUES (?, ?, ?, ?)
  `).run('Alex Kumar', 'alex@example.com', '9876543210', 'Node.js, Express, SQLite, REST APIs');
}

seedIfEmpty();

module.exports = { db, uploadsDir };
