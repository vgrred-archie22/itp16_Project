const crypto = require('node:crypto');
const { db } = require('../config/db');

const COOKIE_NAME = 'task_session';

function getSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const cookie = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Please log in to continue' });
  }

  const session = db.prepare(`
    SELECT users.id, users.username
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), new Date().toISOString());

  if (!session) {
    return res.status(401).json({ error: 'Session expired. Please log in again' });
  }

  req.user = { id: session.id, username: session.username };
  next();
}

module.exports = { COOKIE_NAME, getSessionToken, hashToken, requireAuth };
