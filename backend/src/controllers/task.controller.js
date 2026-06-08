const { pool } = require('../db/pool');
const { validationErrorResponse } = require('../middleware/error.middleware');

async function listTasks(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { status, priority, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const isAdmin = req.user.role === 'admin';

  try {
    const conditions = [];
    const values = [];
    let paramIdx = 1;

    // Admins see all tasks; users see only their own
    if (!isAdmin) {
      conditions.push(`owner_id = $${paramIdx++}`);
      values.push(req.user.id);
    }

    if (status) {
      conditions.push(`status = $${paramIdx++}`);
      values.push(status);
    }
    if (priority) {
      conditions.push(`priority = $${paramIdx++}`);
      values.push(priority);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM tasks ${whereClause}`;
    const dataQuery = `
      SELECT t.id, t.title, t.description, t.status, t.priority,
             t.owner_id, u.name AS owner_name, t.created_at, t.updated_at
      FROM tasks t
      JOIN users u ON u.id = t.owner_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(dataQuery, [...values, parseInt(limit, 10), offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return res.json({
      success: true,
      data: {
        tasks: dataResult.rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getTask(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.title, t.description, t.status, t.priority,
              t.owner_id, u.name AS owner_name, t.created_at, t.updated_at
       FROM tasks t
       JOIN users u ON u.id = t.owner_id
       WHERE t.id = $1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = rows[0];

    // Ownership check — users can only view their own tasks
    if (!isAdmin && task.owner_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    return res.json({ success: true, data: { task } });
  } catch (err) {
    return next(err);
  }
}

async function createTask(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { title, description, status = 'todo', priority = 'medium' } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, status, priority, owner_id, created_at, updated_at`,
      [title, description || null, status, priority, req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Task created.',
      data: { task: rows[0] },
    });
  } catch (err) {
    return next(err);
  }
}

async function updateTask(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const { rows: existing } = await pool.query(
      'SELECT id, owner_id FROM tasks WHERE id = $1',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!isAdmin && existing[0].owner_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { title, description, status, priority } = req.body;

    // Build dynamic update — only set provided fields
    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (title !== undefined) { fields.push(`title = $${paramIdx++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${paramIdx++}`); values.push(description); }
    if (status !== undefined) { fields.push(`status = $${paramIdx++}`); values.push(status); }
    if (priority !== undefined) { fields.push(`priority = $${paramIdx++}`); values.push(priority); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')}
       WHERE id = $${paramIdx}
       RETURNING id, title, description, status, priority, owner_id, created_at, updated_at`,
      values
    );

    return res.json({
      success: true,
      message: 'Task updated.',
      data: { task: rows[0] },
    });
  } catch (err) {
    return next(err);
  }
}

async function deleteTask(req, res, next) {
  const invalid = validationErrorResponse(req, res);
  if (invalid) return;

  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  try {
    const { rows: existing } = await pool.query(
      'SELECT id, owner_id FROM tasks WHERE id = $1',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!isAdmin && existing[0].owner_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

    return res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
