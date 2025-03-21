// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
    try {
      const User = require('../models/User');
      
      if (!req.session.userId) {
        return res.redirect('/login');
      }
      
      const user = await User.findById(req.session.userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).render('error', { 
          error: 'Access Denied',
          message: 'You need administrator privileges to access this page.'
        });
      }
      
      next();
    } catch (err) {
      console.error('Admin check error:', err);
      res.status(500).render('error', { 
        error: 'Server Error',
        message: 'An error occurred while checking permissions.'
      });
    }
  };
  
  module.exports = isAdmin;