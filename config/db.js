const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.join(__dirname, '..');
const databasePath = process.env.SQLITE_DB_PATH
  ? path.resolve(projectRoot, process.env.SQLITE_DB_PATH)
  : path.join(projectRoot, 'data', 'todos.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec(fs.readFileSync(path.join(projectRoot, 'schema.sql'), 'utf8'));

module.exports = { db, databasePath };
