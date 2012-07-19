var projects = require('../lib/projects');
var screens = require('../lib/screens');
var components = require('../lib/components');
var elements = require('../lib/elements');
var users = require('../lib/users');

module.exports = function(app, nconf, db) {
  app.get('/', function (req, res) {
    if (req.session.email) {
      delete req.session.sharedId;
      res.render('index', {
          pageId: 'index'
      });
    } else {
      res.render('example', {
          pageId: 'example'
      });
    }
  });

  // TODO: add validation for parameters
  app.get('/prototype/project/:projectId/screen/:screenId',
    function(req, res) {
      var projectId = req.params.projectId;
      var screenId = req.params.screenId;

      // delete sharedId becuase this user is no longer viewing a shared screen
      delete req.session.sharedId;

      screens.list(req, db, function(err, screenList) {
        // TODO: handle error
        if (err) {
          throw err;
        }

        var screenHash = {};
        screenList.forEach(function(screen) {
          screenHash[screen.id] = screen;
        });

        res.render('prototype', {
          pageId: 'prototype',
          projectId: projectId,
          screenId: screenId,
          screenHash: screenHash,
          sharing: false
        });
      });
    });

  app.get('/share/:userId/project/:projectId/screen/:screenId',
    function(req, res) {
      var projectId = req.params.projectId;
      var screenId = req.params.screenId;
      req.session.sharedId = req.params.userId;

      res.render('prototype', {
        pageId: 'share',
        projectId: projectId,
        screenId: screenId,
        sharing: true
      });
    });

  projects.generateRESTRoutes(app, db);
  screens.generateRESTRoutes(app, db);
  components.generateRESTRoutes(app, db);
  elements.generateRESTRoutes(app, db);
};
