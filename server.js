require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  });

app.get('/api/todos', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id, title, done FROM todos ORDER BY done, id DESC');
  res.json(rows.map((r) => ({ ...r, done: !!r.done })));
}));

app.post('/api/todos', wrap(async (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 255);
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const [result] = await pool.query('INSERT INTO todos (title) VALUES (?)', [title]);
  res.status(201).json({ id: result.insertId, title, done: false });
}));

app.patch('/api/todos/:id', wrap(async (req, res) => {
  const { done } = req.body;
  await pool.query('UPDATE todos SET done = ? WHERE id = ?', [done ? 1 : 0, req.params.id]);
  res.json({ ok: true });
}));

app.delete('/api/todos/completed', wrap(async (req, res) => {
  await pool.query('DELETE FROM todos WHERE done = 1');
  res.json({ ok: true });
}));

app.delete('/api/todos/:id', wrap(async (req, res) => {
  await pool.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

const port = process.env.PORT || 3000;
pool.query('SELECT 1')
  .then(() => app.listen(port, () => console.log(`To-do app running at http://localhost:${port}`)))
  .catch((err) => { console.error('Cannot connect to MariaDB:', err.message); process.exit(1); });
