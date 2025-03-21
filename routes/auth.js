const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Hash password function
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Middleware to check if user is authenticated
const isAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Login page
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Server error' });
  }
});

// Register POST
router.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  // Validate input
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match' });
  }
  
  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('register', { error: 'Username already exists' });
    }
    
    // Create new user
    const hashedPassword = hashPassword(password);
    const newUser = new User({
      username,
      password: hashedPassword
    });
    
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Server error' });
  }
});

// Dashboard page
router.get('/dashboard', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;