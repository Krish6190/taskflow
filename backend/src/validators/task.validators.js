const { body, param, query } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required.')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1–200 characters.')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters.')
    .escape(),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),
];

const updateTaskValidator = [
  param('id')
    .isUUID().withMessage('Invalid task ID.'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1–200 characters.')
    .escape(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters.')
    .escape(),

  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Status must be todo, in_progress, or done.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),
];

const taskIdValidator = [
  param('id').isUUID().withMessage('Invalid task ID.'),
];

const listTasksValidator = [
  query('status')
    .optional()
    .isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status filter.'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority filter.'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];

module.exports = { createTaskValidator, updateTaskValidator, taskIdValidator, listTasksValidator };
