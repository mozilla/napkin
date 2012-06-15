const ALLOWED_FIELDS = {
        title: undefined,
        is_start: undefined,
        layout: undefined
      };

var projects = require('./projects');
var utils = require('./utils');

/* Screen List Per Project
 * Requires: web request, db connection
 * Returns: A listing of the user's screens within a project
 */
exports.list = function(req, db, callback) {
  var screenList = [];
  var counter = 0;

  db.keys('project:' + req.params.id + ':screen:*', function(err, screens) {
    try {
      var getScreens = function(screen, counter) {
        db.get(screen, function(errScreen, screen) {
          screen = JSON.parse(screen);
          var screenHash = {
            title: screen.title
          };

          screenList.unshift(screenHash);

          if (counter === screens.length) {
            return callback(null, screenList);
          }
        });
      };

      screens.forEach(function(screen, idx) {
        counter++;
        getScreens(screen, counter);
      });
    } catch(err) {
      return callback(err);
    }
  });
};

/* Screen Get
 * Requires: web request, db connection, identifier
 * Returns: A screen object if found, error if not found
 */
exports.get = function(req, db, identifier, callback) {
  db.get('project:' + req.params.id + ':screen:' + identifier, function(err, screen) {
    if (err) {
      return callback(err);
    }

    return callback(null, JSON.parse(screen));
  });
};

/* Screen Add
 * Requires: web request, db connection
 * Returns: Screen object if successful, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  projects.get(req, db, req.body.id, function(err, project) {
    if (err) {
      return callback(err);
    }

    db.incr('project:' + req.body.id + ':screen', function(errIncr, id) {
      if (errIncr) {
        return callback(errIncr);
      }

      var identifier = id;

      var screen = {
        id: identifier,
        title: req.body.title,
        is_start: req.body.is_start,
        layout: req.body.layout
      };

      db.set('project:' + req.body.id + ':screen:' + identifier, JSON.stringify(screen), function(errAddScreen) {
        if (errAddScreen) {
          return callback(errAddScreen);
        }

        db.get('project:' + req.body.id + ':screen:' + identifier, function(errScreen, newScreen) {
          if (errScreen) {
            return callback(errScreen);
          }

          return callback(null, JSON.parse(newScreen));
        });
      });
    });
  });
};

/* Screen Update
 * Requires: web request, db connection, identifier
 * Returns: Screen object if successful, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  projects.get(req, db, req.body.id, function(err, project) {
    if (err) {
      return callback(err);
    }

    var screenKey = 'project:' + project.id + ':screen:' + identifier;

    db.get(screenKey, function(errScreen, screen) {
      if (errScreen) {
        return callback(errScreen);
      }

      var updatedScreen = utils.updateObject(req, screen, ALLOWED_FIELDS);

      db.set(screenKey, updatedScreen, function(errScreen) {
        if (errScreen) {
          return callback(errScreen);
        }

        return callback(null, updatedScreen);
      });
    });
  });
};

/* Screen Delete
 * Requires: web request, db connection
 * Returns: True if deleted, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  projects.get(req, db, req.body.id, function(err, project) {
    if (err) {
      return callback(err);
    }

    db.del('project:' + req.body.id + ':screen:' + identifier, function(errScreen, screen) {
      if (errScreen) {
        return callback(errScreen);
      }

      return callback(null, true);
    });
  });
};
