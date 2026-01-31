const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// All task routes require authentication
router.use(authMiddleware);

// GET    /api/tasks       - Get all tasks
router.get('/', getAllTasks);

// GET    /api/tasks/:id   - Get single task
router.get('/:id', getTask);

// POST   /api/tasks       - Create task
router.post('/', createTask);

// PUT    /api/tasks/:id   - Update task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id   - Delete task
router.delete('/:id', deleteTask);

module.exports = router;
