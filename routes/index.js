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

  app.get(/\/prototype\/project\/(\d+)\/screen\/(\d+)/, function(req, res) {
    var projectId = req.params[0];
    var screenId = req.params[1];
    res.render('prototype', {
      pageId: 'prototype',
      projectId: projectId,
      screenId: screenId
    });
  });

  projects.generateRESTRoutes(app, db);
  screens.generateRESTRoutes(app, db);
  components.generateRESTRoutes(app, db);
  elements.generateRESTRoutes(app, db);
};
