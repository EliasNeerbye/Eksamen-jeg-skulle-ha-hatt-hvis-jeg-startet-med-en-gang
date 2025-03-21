const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
secret: process.env.SESSION_SECRET,
resave: false,
saveUninitialized: false,
cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);
app.use('/tasks', taskRoutes);

// Home route
app.get('/', (req, res) => {
if (req.session.userId) {
    res.redirect('/dashboard');
} else {
    res.redirect('/login');
}
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});