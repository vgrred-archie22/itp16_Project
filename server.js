require('dotenv').config();
const express = require('express');
const path = require('path');
let database;
try {
  database = require('./config/db');
} catch (err) {
  console.error('Failed to initialize SQLite database:', err.message);
  process.exit(1);
}
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

app.listen(port, () => {
  console.log(`🚀 To-do application running at http://localhost:${port}`);
  console.log(`SQLite database: ${database.databasePath}`);
});
