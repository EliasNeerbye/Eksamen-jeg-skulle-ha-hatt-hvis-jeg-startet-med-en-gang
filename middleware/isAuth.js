// Improved middleware to check if user is authenticated
const isAuth = async (req, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const User = require('../models/User');
        const user = await User.findById(req.session.userId);
        
        if (!user) {
          // User not found in database, clear session
          req.session.destroy(err => {
            if (err) console.error('Error destroying session:', err);
            return res.redirect('/login');
          });
        } else {
          // User found, attach to request object
          req.user = user;
          return next();
        }
      } catch (err) {
        console.error('Authentication error:', err);
        return res.redirect('/login');
      }
    } else {
      // No session data
      return res.redirect('/login');
    }
  };
  
  module.exports = isAuth;