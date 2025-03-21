const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Get all tasks for current user
router.get('/', isAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.session.userId });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tasks for a specific day
router.get('/day/:day', isAuth, async (req, res) => {
  const { day } = req.params;
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!validDays.includes(day.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid day' });
  }
  
  try {
    const tasks = await Task.find({ 
      user: req.session.userId,
      dayOfWeek: day.toLowerCase()
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new task
router.post('/', isAuth, async (req, res) => {
  const { title, description, dayOfWeek, isRecurring } = req.body;
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!title || !dayOfWeek || !validDays.includes(dayOfWeek.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  try {
    const newTask = new Task({
      title,
      description,
      dayOfWeek: dayOfWeek.toLowerCase(),
      user: req.session.userId,
      isRecurring: isRecurring === 'true' || isRecurring === true
    });
    
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a task
router.put('/:id', isAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, completed, dayOfWeek, isRecurring } = req.body;
  
  try {
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.user.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        title: title || task.title,
        description: description !== undefined ? description : task.description,
        completed: completed !== undefined ? completed : task.completed,
        dayOfWeek: dayOfWeek ? dayOfWeek.toLowerCase() : task.dayOfWeek,
        isRecurring: isRecurring !== undefined ? isRecurring : task.isRecurring
      },
      { new: true }
    );
    
    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', isAuth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.user.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle task completion
router.patch('/:id/toggle', isAuth, async (req, res) => {
  const { id } = req.params;
  
  try {
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.user.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    task.completed = !task.completed;
    await task.save();
    
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;