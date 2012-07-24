var auth = require('../lib/authenticate');
var users = require('../lib/users');
var utils = require('../lib/utils');

module.exports = function(app, nconf, db) {
  var extractSharedEmail = utils.extractSharedEmail(db);
  var confirmScaffoldExistence = utils.confirmScaffoldExistence(db);

  // Log in to napkin
  app.post('/login', function(req, res) {
    auth.verify(req, nconf, function(err, email) {
      if (err) {
        throw err;
      }

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

  // Log in to project
  app.post('/share/:userId/project/:projectId/screen/:screenId/login',
    extractSharedEmail, confirmScaffoldExistence, function(req, res) {
    var projectId = req.project.id;
    var screenId = req.screen.id;

    auth.verify(req, nconf, function(err, email) {
      if (err) {
        throw err;
      }

      if (email) {
        if (!req.session.auth) {
          req.session.auth = {};
        }

        req.session.auth[projectId] = email;
        res.redirect('/share/' + req.params.userId + '/project/' +
          req.project.id + '/screen/' + req.screen.id);
      }
    });
    
  });

  // Log out of napkin
  app.get('/logout', function(req, res) {
    if (req.session) {
      req.session.reset();
    }

    res.redirect('/', 303);
  });

  // Log out of project
  app.get('/share/:userId/project/:projectId/screen/:screenId/logout',
    extractSharedEmail, confirmScaffoldExistence, function(req, res) {
      if (req.session && req.session.auth) {
        delete req.session.auth[req.project.id];
      }

      res.redirect('/share/' + req.session.sharedId + '/project/' +
        req.project.id + '/screen/' + req.screen.id, 303);
    });
};
