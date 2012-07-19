var auth = require('../lib/authenticate');
var users = require('../lib/users');

module.exports = function(app, nconf, db) {
  // Login
  app.post('/login', function(req, res) {
    auth.verify(req, nconf, function(error, email) {
      if (email) {
        req.session.email = email;
        users.getId(db, email, function(err, id) {
          // TODO: handle error
          if (err) {
            throw err;
          }

          req.session.id = id;
          res.redirect('/');
        });
      }
    });
  });

  // Logout
  app.get('/logout', function(req, res) {
    if (req.session) {
      req.session.reset();
    }
    res.redirect('/', 303);
  });
};
