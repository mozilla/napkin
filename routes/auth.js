var auth = require('../lib/authenticate');

module.exports = function(app, nconf) {
  // Login
  app.post('/login', function(req, res) {
    auth.verify(req, nconf, function(error, email) {
      if (email) {
        req.session.email = email;
      }
      res.redirect('/');
    });
  });

  // Logout
  app.get('/logout', function(req, res) {
    if (req.session) {
      delete req.session.email;
    }
    res.redirect('/?logged_out=1', 303);
  });
};
