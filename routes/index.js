var projects = require('../lib/projects');
var screens = require('../lib/screens');
var components = require('../lib/components');
var elements = require('../lib/elements');
var users = require('../lib/users');
var utils = require('../lib/utils');

module.exports = function(app, nconf, db) {
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
    confirmAuthentication, confirmScaffoldExistence, function(req, res) {
      var projectId = req.project.id;
      var screenId = req.screen.id;

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
    confirmScaffoldExistence, function(req, res) {
      var projectId = req.project.id;
      var screenId = req.screen.id;
      req.session.sharedId = req.params.userId;

      res.render('prototype', {
        pageId: 'share',
        projectId: projectId,
        screenId: screenId,
        sharing: true
      });
    });

  projects.generateRESTRoutes(app, db, confirmAuthentication);
  screens.generateRESTRoutes(app, db, confirmAuthentication);
  components.generateRESTRoutes(app, db, confirmAuthentication);
  elements.generateRESTRoutes(app, db, confirmAuthentication);

  /* Confirms that the current user is authenticated. If he/she is not,
   * redirects to 404 page. This is meant to be used as Express middleware.
   * Requires: web request, web response, next function to call when done
   */
  function confirmAuthentication(req, res, next) {
    if (req.session.email) {
      next();
    } else {
      utils.render404(req, res);
    }
  }

  /* Confirms that the ids in req correspond to existing scaffolds. Also
   * extracts the existing scaffolds into the request object This is meant to be
   * used as Express middleware.
   * Requires: web request, web response, next function to call when done
   */
  function confirmScaffoldExistence(req, res, next) {
    var numCallbacks = 0;
    var numFinished = 0;

    if (req.params.projectId) {
      numCallbacks++;

      projects.get(req, db, req.params.projectId, function(err, project) {
        if (err) {
          next(err);
        } else if (!project) {
          utils.render404(req, res);
        } else {
          req.project = project;

          // have all callbacks finished?
          numFinished++;
          if (numFinished === numCallbacks) {
            next();
          }
        }
      });
    }

    if (req.params.screenId) {
      numCallbacks++;

      screens.get(req, db, req.params.screenId, function(err, screen) {
        if (err) {
          next(err);
        } else if (!screen) {
          utils.render404(req, res);
        } else {
          req.screen = screen;

          // have all callbacks finished?
          numFinished++;
          if (numFinished === numCallbacks) {
            next();
          }
        }
      });
    }
  }
};
