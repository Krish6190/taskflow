/**
 * Centralized error handler.
 *
 * SECURITY: This handler deliberately strips internal error details before
 * sending responses. We never send stack traces, query strings, or raw DB
 * errors to the client. We also never console.log the full error object
 * in production to avoid leaking connection strings or user data via logs.
 */

const { validationResult } = require('express-validator');

// Classify known error types to safe HTTP responses
function classifyError(err) {
  // PostgreSQL unique violation
  if (err.code === '23505') {
    return { status: 409, message: 'A record with that value already exists.' };
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return { status: 400, message: 'Referenced resource does not exist.' };
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return { status: 401, message: 'Invalid token.' };
  }
  if (err.name === 'TokenExpiredError') {
    return { status: 401, message: 'Token has expired.' };
  }
  // Application-level errors thrown with a status
  if (err.status && err.status < 500) {
    return { status: err.status, message: err.message };
  }
  return null;
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const classified = classifyError(err);

  if (classified) {
    return res.status(classified.status).json({
      success: false,
      message: classified.message,
    });
  }

  // Unknown / server errors
  if (process.env.NODE_ENV !== 'production') {
    // In dev, log the full error for debugging — but only to server console, never response
    console.error('[error]', err.message, err.stack);
  } else {
    // In production, log only message — no stack, no data
    console.error('[error]', err.message);
  }

  return res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    // Never include err.message in production responses — it may leak DB schema details
  });
}

// Validation error extractor — call at the start of controllers
function extractValidationErrors(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const safe = errors.array().map(e => ({ field: e.path, message: e.msg }));
    const err = new Error('Validation failed');
    err.status = 422;
    err.validationErrors = safe;
    return err;
  }
  return null;
}

function validationErrorResponse(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const safe = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors: safe });
  }
  return null;
}

module.exports = { errorHandler, extractValidationErrors, validationErrorResponse };
