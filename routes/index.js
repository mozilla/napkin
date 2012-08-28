var fs = require('fs');
var projects = require('../lib/projects');
var screens = require('../lib/screens');
var components = require('../lib/components');
var elements = require('../lib/elements');
var users = require('../lib/users');
var utils = require('../lib/utils');
var exportProject = require('../export');

module.exports = function(app, nconf, db) {
  var extractSharedEmail = utils.extractSharedEmail(db);
  var confirmScaffoldExistence = utils.confirmScaffoldExistence(db);
  var rootUrl = nconf.get('domain') + ':' + nconf.get('port');

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
          projectId: req.project.id,
          screenId: req.screen.id,
          screenHash: screenHash,
          sharing: false
        });

        var url = rootUrl + req.path.replace('/prototype',
          '/share/' + req.session.id);
        screens.generateScreenshot(req, db, req.screen.id, url);
      });
    });

  app.get('/share/:userId/project/:projectId/screen/:screenId',
    extractSharedEmail, confirmScaffoldExistence, function(req, res) {
      var authenticated = true;
      if (req.screen.secure && (!req.session.auth ||
          !req.session.auth[req.project.id])) {
        authenticated = false;
      }

      res.render('prototype', {
        pageId: 'share',
        userId: req.params.userId,
        projectId: req.project.id,
        projectAuthor: req.project.authorId,
        screenId: req.screen.id,
        authenticated: authenticated,
        sharing: true
      });
    });

  app.get('/export/project/:projectId', utils.confirmAuthentication,
    confirmScaffoldExistence, function(req, res) {
      delete req.session.sharedId;
      exportProject(req.project, req, db, function(zipFile) {
        res.download(zipFile, function() {
          fs.unlink(zipFile);
        });
      });
    });

  projects.generateRESTRoutes(app, db, utils.confirmAuthentication);
  screens.generateRESTRoutes(app, db, utils.confirmAuthentication);
  components.generateRESTRoutes(app, db, utils.confirmAuthentication);
  elements.generateRESTRoutes(app, db, utils.confirmAuthentication);
};
