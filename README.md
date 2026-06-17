# CodeAlpha_JobBoard

**CodeAlpha Backend Internship — Task 4: Job Board Platform**

A backend API for job listings, employers, candidates, resume uploads, job applications, employer notifications, and application statistics.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (via `better-sqlite3`)
- **File uploads:** Multer (resume storage)

## Features

- Employer and candidate management
- Job posting and search with filters
- Resume upload (PDF, DOC, DOCX, TXT)
- Job applications with duplicate prevention
- Application status tracking
- Employer notifications on new applications
- Application statistics and reporting
- Sample data seeded on first run
- Web UI for job search and apply

## Project Structure

```
CodeAlpha_JobBoard/
├── db/
│   └── database.js           # SQLite schema & seed data
├── routes/
│   ├── employers.js
│   ├── jobs.js
│   ├── candidates.js
│   ├── applications.js
│   ├── notifications.js
│   └── reports.js
├── public/
│   └── index.html            # Frontend UI
├── uploads/                  # Uploaded resumes (auto-created)
├── data/                     # SQLite database (auto-created)
├── server.js
└── package.json
```

## Setup & Run

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
cd CodeAlpha_JobBoard
npm install
```

### Start server

```bash
npm start
```

Server runs at **http://localhost:3004**

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Employers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employers` | List all employers |
| GET | `/api/employers/:id` | Get employer details |
| POST | `/api/employers` | Register an employer |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Search/list jobs (with filters) |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Post a new job |
| PATCH | `/api/jobs/:id/status` | Open or close a job |

**Search filters:** `q`, `location`, `job_type`, `employer_id`, `status`

### Candidates & Resumes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | List candidates |
| GET | `/api/candidates/:id` | Get candidate details |
| POST | `/api/candidates` | Register a candidate |
| GET | `/api/candidates/:id/resumes` | List candidate resumes |
| POST | `/api/candidates/:id/resume` | Upload resume (multipart) |

### Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | Track applications (filtered) |
| POST | `/api/applications/jobs/:jobId/apply` | Apply for a job |
| PATCH | `/api/applications/:id/status` | Update application status |

**Application filters:** `candidate_id`, `job_id`, `employer_id`, `status`

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications?employer_id=1` | Get employer notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification as read |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/stats` | Application statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Example Requests

### Search jobs

```http
GET /api/jobs?q=backend&location=Bangalore&job_type=full-time
```

### Post a job

```http
POST /api/jobs
Content-Type: application/json

{
  "employer_id": 1,
  "title": "Senior Node.js Developer",
  "description": "Lead backend development for microservices.",
  "location": "Hyderabad",
  "job_type": "full-time",
  "salary_min": 1200000,
  "salary_max": 1800000
}
```

### Register a candidate

```http
POST /api/candidates
Content-Type: application/json

{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "9876543210",
  "skills": "JavaScript, Node.js, SQL"
}
```

### Upload resume

```http
POST /api/candidates/1/resume
Content-Type: multipart/form-data

resume: [file]
```

Allowed formats: `.pdf`, `.doc`, `.docx`, `.txt` (max 5 MB)

### Apply for a job

```http
POST /api/applications/jobs/1/apply
Content-Type: application/json

{
  "candidate_id": 1,
  "resume_id": 1,
  "cover_letter": "I am excited to apply for this role..."
}
```

### Track applications (employer view)

```http
GET /api/applications?employer_id=1
```

### Update application status

```http
PATCH /api/applications/1/status
Content-Type: application/json

{
  "status": "shortlisted"
}
```

Valid statuses: `submitted`, `reviewed`, `shortlisted`, `rejected`, `hired`

### Get employer notifications

```http
GET /api/notifications?employer_id=1&unread_only=true
```

### Application statistics

```http
GET /api/reports/stats
```

## Sample Data

Seeded on first run:

- **2 employers** (TechCorp, StartupIO)
- **3 job listings** (Backend Developer, DevOps Engineer, Frontend Intern)
- **1 candidate** (Alex Kumar — use ID `1` for demo apply in UI)

## Web UI

Visit **http://localhost:3004** to search jobs and apply using candidate ID `1`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3004` | Server port |

## Author

CodeAlpha Backend Development Internship — M1
