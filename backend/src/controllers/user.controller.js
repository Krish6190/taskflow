const { pool } = require('../db/pool');
const { validationErrorResponse } = require('../middleware/error.middleware');
const { param } = require('express-validator');

// Never return password_hash to any client
function sanitizeUser(user) {
  const { password_hash, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
}

async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, data: { users: rows } });
  } catch (err) {
    return next(err);
  }
}

async function getUser(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, data: { user: rows[0] } });
  } catch (err) {
    return next(err);
  }
}

async function updateUserRole(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(422).json({ success: false, message: 'Role must be user or admin.' });
  }

  // Prevent self-demotion
  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot change your own role.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, is_active`,
      [role, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, message: 'Role updated.', data: { user: rows[0] } });
  } catch (err) {
    return next(err);
  }
}

async function deactivateUser(req, res, next) {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, is_active`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, message: 'User deactivated.', data: { user: rows[0] } });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listUsers, getUser, updateUserRole, deactivateUser };
