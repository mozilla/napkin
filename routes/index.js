var projects = require('../lib/projects');
var screens = require('../lib/screens');

module.exports = function(app, nconf, db) {
  app.get('/', function (req, res) {
    if (req.session.email) {
      res.render('index');
    } else {
      res.render('example');
    }
  });

  projects.generateRESTRoutes(app, db);
  screens.generateRESTRoutes(app, db);
};
