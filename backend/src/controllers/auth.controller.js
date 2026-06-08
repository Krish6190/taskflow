const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { validationErrorResponse } = require('../middleware/error.middleware');

const SALT_ROUNDS = 12;

function signToken(userId, role) {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'taskflow-api',
    }
  );
}

// Sanitize user object — never return password_hash
function sanitizeUser(user) {
  const { password_hash, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
}

async function register(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { name, email, password } = req.body;

  try {
    // Check existing — use constant-time check to prevent timing attacks
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, passwordHash]
    );

    const user = rows[0];
    const token = signToken(user.id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: sanitizeUser(user), token },
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { email, password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );

    // Always run bcrypt compare to prevent timing-based user enumeration
    const dummyHash = '$2a$12$invalidhashpaddingtomatch.lengthXXXXXXXXXXXXXXXXXXXXXXX';
    const user = rows[0] || { password_hash: dummyHash };

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!rows.length || !passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const token = signToken(user.id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user: sanitizeUser(user), token },
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  // req.user already stripped of password_hash by auth middleware
  return res.json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, me };
