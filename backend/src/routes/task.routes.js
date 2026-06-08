/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management
 */

const express = require('express');
const router = express.Router();
const { listTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/task.controller');
const { createTaskValidator, updateTaskValidator, taskIdValidator, listTasksValidator } = require('../validators/task.validators');
const { authenticate } = require('../middleware/auth.middleware');

// All task routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: List tasks (own tasks for users, all for admins)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of tasks }
 */
router.get('/', listTasksValidator, listTasks);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task data }
 *       404: { description: Not found }
 */
router.get('/:id', taskIdValidator, getTask);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done] }
 *               priority: { type: string, enum: [low, medium, high] }
 *     responses:
 *       201: { description: Task created }
 */
router.post('/', createTaskValidator, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated task }
 *       404: { description: Not found }
 */
router.patch('/:id', updateTaskValidator, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Task deleted }
 *       404: { description: Not found }
 */
router.delete('/:id', taskIdValidator, deleteTask);

module.exports = router;
