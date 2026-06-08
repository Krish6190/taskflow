const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

/**
 * Verify JWT and attach user to request.
 * SECURITY: We never log the token value, only its presence.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch user to ensure they're still active (not deactivated after token issue)
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account not found or inactive.' });
    }

    req.user = rows[0];
    return next();
  } catch (err) {
    // Classify the JWT error safely — never log the token itself
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    // Unexpected error — log only the type, not token contents
    console.error('[auth] Unexpected error during token verification:', err.message);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
}

/** Require admin role. Must be used after authenticate. */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  return next();
}

/** Require specific roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    return next();
  };
}

module.exports = { authenticate, requireAdmin, requireRole };
