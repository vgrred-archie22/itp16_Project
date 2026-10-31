const { db } = require('../config/db');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

exports.getTodos = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    let query = 'SELECT id, title, done, priority, created_at, updated_at FROM todos WHERE user_id = ?';
    const params = [req.user.id];

    if (status === 'active') {
      query += ' AND done = 0';
    } else if (status === 'done') {
      query += ' AND done = 1';
    }

    if (priority && VALID_PRIORITIES.includes(priority.toLowerCase())) {
      query += ' AND priority = ?';
      params.push(priority.toLowerCase());
    }

    if (search && search.trim()) {
      query += ' AND title LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY done ASC, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, id DESC`;

    const rows = db.prepare(query).all(...params);

    const todos = rows.map((row) => ({
      ...row,
      done: Boolean(row.done),
    }));

    res.json(todos);
  } catch (err) {
    next(err);
  }
};

exports.createTodo = async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim().slice(0, 255);
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let priority = String(req.body.priority || 'medium').toLowerCase();
    if (!VALID_PRIORITIES.includes(priority)) {
      priority = 'medium';
    }

    const result = db.prepare(
      'INSERT INTO todos (user_id, title, priority) VALUES (?, ?, ?)'
    ).run(req.user.id, title, priority);

    const row = db.prepare(
      'SELECT id, title, done, priority, created_at, updated_at FROM todos WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json({
      ...row,
      done: Boolean(row.done),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTodo = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const current = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!current) {
      return res.status(404).json({ error: 'Task not found' });
    }

    let newTitle = current.title;
    let newDone = current.done;
    let newPriority = current.priority;

    if (req.body.title !== undefined) {
      const trimmed = String(req.body.title).trim().slice(0, 255);
      if (!trimmed) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      newTitle = trimmed;
    }

    if (req.body.done !== undefined) {
      newDone = req.body.done ? 1 : 0;
    }

    if (req.body.priority !== undefined) {
      const prio = String(req.body.priority).toLowerCase();
      if (!VALID_PRIORITIES.includes(prio)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      newPriority = prio;
    }

    db.prepare(
      'UPDATE todos SET title = ?, done = ?, priority = ? WHERE id = ? AND user_id = ?'
    ).run(newTitle, newDone, newPriority, id, req.user.id);

    const updated = db.prepare(
      'SELECT id, title, done, priority, created_at, updated_at FROM todos WHERE id = ?'
    ).get(id);

    res.json({
      ...updated,
      done: Boolean(updated.done),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTodo = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ ok: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.clearCompleted = async (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM todos WHERE done = 1 AND user_id = ?').run(req.user.id);
    res.json({ ok: true, deletedCount: result.changes });
  } catch (err) {
    next(err);
  }
};
