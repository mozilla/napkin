var projects = require('../lib/projects');
var screens = require('../lib/screens');

module.exports = function(app, nconf, db) {
  app.get('/', function (req, res) {
    res.render('index');
  });

  app.get('/example', function (req, res) {
    res.render('example');
  });

  projects.generateRESTRoutes(app, db);
  screens.generateRESTRoutes(app, db);
};
