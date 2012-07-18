var projects = require('../lib/projects');
var screens = require('../lib/screens');
var components = require('../lib/components');
var elements = require('../lib/elements');

module.exports = function(app, nconf, db) {
  app.get('/', function (req, res) {
    if (req.session.email) {
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

      screens.list(req, db, function(err, screenList) {
        if (err) {
          throw err;
        }

        var screenHash = {};
        screenList.forEach(function(screen) {
          screenHash[screen.id] = screen;
        });

        console.log(screenHash);
        res.render('prototype', {
          pageId: 'prototype',
          projectId: projectId,
          screenId: screenId,
          screenHash: screenHash
        });
      });
    });

  projects.generateRESTRoutes(app, db);
  screens.generateRESTRoutes(app, db);
  components.generateRESTRoutes(app, db);
  elements.generateRESTRoutes(app, db);
};
