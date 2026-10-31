require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./config/db');
const todoRoutes = require('./routes/todoRoutes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/todos', todoRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.PORT || 3000;

pool.query('SELECT 1')
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 To-do application running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MariaDB/MySQL:', err.message);
    process.exit(1);
  });
