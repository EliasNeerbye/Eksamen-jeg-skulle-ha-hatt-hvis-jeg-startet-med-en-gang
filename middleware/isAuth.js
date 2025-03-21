// Middleware to check if user is authenticated
const isAuth = async (req, res, next) => {
    if (req.session.userId) {
      // Fetch user information and add to request
      try {
        const User = require('../models/User');
        const user = await User.findById(req.session.userId);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (err) {
        console.error('Authentication error:', err);
      }
    }
    
    res.redirect('/login');
  };
  
  module.exports = isAuth;