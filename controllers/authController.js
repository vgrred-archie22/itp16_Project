const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { db } = require('../config/db');
const { COOKIE_NAME, hashToken } = require('../middleware/requireAuth');

const scrypt = promisify(crypto.scrypt);
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_BYTES = 64;

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_MS / 1000}${secure}`
  );
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, expiresAt);
  setSessionCookie(res, token);
}

function validateCredentials(username, password) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername)) {
    return { error: 'Username must be 3–32 characters using letters, numbers, or underscores' };
  }
  if (normalizedPassword.length < 12 || normalizedPassword.length > 128) {
    return { error: 'Password must be between 12 and 128 characters' };
  }
  return { username: normalizedUsername, password: normalizedPassword };
}

exports.register = async (req, res, next) => {
  try {
    const body = req.body || {};
    const credentials = validateCredentials(body.username, body.password);
    if (credentials.error) {
      return res.status(400).json({ error: credentials.error });
    }

    const salt = crypto.randomBytes(16);
    const passwordHash = await scrypt(credentials.password, salt, PASSWORD_BYTES);

    let userId;
    db.exec('BEGIN IMMEDIATE');
    try {
      const usersBeforeInsert = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
      const result = db.prepare(
        'INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)'
      ).run(credentials.username, passwordHash.toString('hex'), salt.toString('hex'));
      userId = result.lastInsertRowid;

      if (usersBeforeInsert === 0) {
        db.prepare('UPDATE todos SET user_id = ? WHERE user_id IS NULL').run(userId);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      if (err.code === 'ERR_SQLITE_ERROR' && err.message === 'UNIQUE constraint failed: users.username') {
        return res.status(409).json({ error: 'That username is already taken' });
      }
      throw err;
    }

    await createSession(userId, res);
    res.status(201).json({ id: userId, username: credentials.username });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const body = req.body || {};
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!/^[a-z0-9_]{3,32}$/.test(username) || !password || password.length > 128) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = db.prepare(
      'SELECT id, username, password_hash, password_salt FROM users WHERE username = ?'
    ).get(username);

    if (!user) {
      await scrypt(password, 'task-master-invalid-user', PASSWORD_BYTES);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const candidate = await scrypt(password, Buffer.from(user.password_salt, 'hex'), PASSWORD_BYTES);
    const storedHash = Buffer.from(user.password_hash, 'hex');
    if (!crypto.timingSafeEqual(candidate, storedHash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
    await createSession(user.id, res);
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    next(err);
  }
};

exports.currentUser = (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
};

exports.logout = (req, res) => {
  const { getSessionToken } = require('../middleware/requireAuth');
  const token = getSessionToken(req);
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
  clearSessionCookie(res);
  res.json({ ok: true });
};
