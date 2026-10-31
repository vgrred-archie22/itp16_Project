const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.join(__dirname, '..');
const databasePath = process.env.SQLITE_DB_PATH
  ? path.resolve(projectRoot, process.env.SQLITE_DB_PATH)
  : path.join(projectRoot, 'data', 'todos.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON');
db.exec(fs.readFileSync(path.join(projectRoot, 'schema.sql'), 'utf8'));

const todoColumns = db.prepare('PRAGMA table_info(todos)').all();
if (!todoColumns.some((column) => column.name === 'user_id')) {
  db.exec('ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE');
}
db.exec('CREATE INDEX IF NOT EXISTS idx_todos_user_done_priority ON todos (user_id, done, priority, id DESC)');

module.exports = { db, databasePath };
