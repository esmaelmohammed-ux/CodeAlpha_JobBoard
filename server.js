const express = require('express');
const path = require('path');
const employerRoutes = require('./routes/employers');
const jobRoutes = require('./routes/jobs');
const candidateRoutes = require('./routes/candidates');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const { uploadsDir } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3004;
// comme
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Job Board Platform' });
});

app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`Job Board Platform running at http://localhost:${PORT}`);
});
