const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');

// Only authenticated administrators can access the documentation
router.get('/veiledning', isAuth, isAdmin, (req, res) => {
  res.render('documentation', {
    user: req.user,
    title: 'System Documentation'
  });
});

module.exports = router;