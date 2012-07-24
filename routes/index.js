var projects = require('../lib/projects');
var screens = require('../lib/screens');
var components = require('../lib/components');
var elements = require('../lib/elements');
var users = require('../lib/users');
var utils = require('../lib/utils');

module.exports = function(app, nconf, db) {
  var extractSharedEmail = utils.extractSharedEmail(db);
  var confirmScaffoldExistence = utils.confirmScaffoldExistence(db);

  app.get('/', function(req, res) {
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
    utils.confirmAuthentication, confirmScaffoldExistence,
    function(req, res) {
      var projectId = req.project.id;
      var screenId = req.screen.id;

      // delete sharedId becuase this user is no longer viewing a shared screen
      // TODO: this needs to go in every non-sharing route; find a way to
      // factor it out
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
    extractSharedEmail, confirmScaffoldExistence, function(req, res) {
      var projectId = req.project.id;
      var screenId = req.screen.id;

      res.render('prototype', {
        pageId: 'share',
        userId: req.params.userId,
        projectId: projectId,
        screenId: screenId,
        sharing: true
      });
    });

  projects.generateRESTRoutes(app, db, utils.confirmAuthentication);
  screens.generateRESTRoutes(app, db, utils.confirmAuthentication);
  components.generateRESTRoutes(app, db, utils.confirmAuthentication);
  elements.generateRESTRoutes(app, db, utils.confirmAuthentication);
};
