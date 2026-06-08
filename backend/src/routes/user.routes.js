/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin only)
 */

const express = require('express');
const router = express.Router();
const { listUsers, getUser, updateUserRole, deactivateUser } = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// All user-management routes require admin
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of users }
 *       403: { description: Admin required }
 */
router.get('/', listUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User data }
 *       404: { description: Not found }
 */
router.get('/:id', getUser);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Update user role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200: { description: Role updated }
 */
router.patch('/:id/role', updateUserRole);

/**
 * @swagger
 * /api/v1/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: User deactivated }
 */
router.patch('/:id/deactivate', deactivateUser);

module.exports = router;
