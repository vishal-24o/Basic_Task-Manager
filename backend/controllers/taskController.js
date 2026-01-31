const Task = require('../models/Task');

// Get all tasks (only current user's)
async function getAllTasks(req, res) {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single task (must belong to current user)
async function getTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (task.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Create task (set owner from token)
async function createTask(req, res) {
  try {
    const task = await Task.create({ ...req.body, user: req.userId });
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update task (must belong to current user)
async function updateTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (task.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete task (must belong to current user)
async function deleteTask(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (task.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted', task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};
