const ALLOWED_FIELDS = {
        layout: undefined,
        action: undefined
      };

var screens = require('./screens');
var projects = require('./projects');
var utils = require('./utils');

/* Component List Per Screen
 * Requires: web request, db connection
 * Returns: A listing of the user's components within a screen
 */
exports.list = function(req, db, callback) {
  var componentList = [];

  db.keys('project:' + req.body.project_id + ':screen:' + req.params.id + ':component:*', function(err, components) {


    try {
      var getComponents = function(component, counter) {
        db.get(component, function(errComponent, component) {
          component = JSON.parse(component);

          var componentHash = {
            type: component.type,
            layout: component.layout,
            action: component.action
          };

          componentList.unshift(componentHash);

          if (counter === components.length - 1) {
            return callback(null, componentList);
          }
        });
      };

      components.forEach(getComponents);
    } catch(err) {
      return callback(err);
    }
  });
};

/* Component Add
 * Requires: web request, db connection
 * Returns: Component object if successful, false if email doesn't match, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  projects.get(req, db, req.body.project_id, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    db.incr('project:' + req.body.project_id + ':screen:' + req.body.id + ':component', function(errIncr, id) {
      if (errIncr) {
        return callback(errIncr);
      }

      var identifier = id;

      var component = {
        id: identifier,
        type: req.body.type,
        layout: req.body.layout,
        action: req.body.action
      };

      db.set('project:' + req.body.project_id + ':screen:' + req.body.id + ':component:' + identifier, JSON.stringify(component),
        function(errAddComponent) {
          if (errAddComponent) {
            return callback(errAddComponent);
          }

          db.get('project:' + req.body.project_id + ':screen:' + req.body.id + ':component:' + identifier,
            function(errComponent, newComponent) {
              if (errComponent) {
                return callback(errComponent);
              }

              return callback(null, JSON.parse(newComponent));
            });
        });
    });
  });
};

/* Component Update
 * Requires: web request, db connection, identifier
 * Returns: Component object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  projects.get(req, db, req.body.project_id, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    var componentKey = 'project:' + req.body.project_id + ':screen:' + req.body.id + ':component:' + identifier;

    db.get(componentKey, function(errComponent, component) {
      if (errComponent) {
        return callback(errComponent);
      }

      var updatedComponent = utils.updateObject(req, component, ALLOWED_FIELDS);

      db.set(componentKey, updatedComponent, function(errComponent) {
        if (errComponent) {
          return callback(errComponent);
        }

        return callback(null, updatedComponent);
      });
    });
  });
};

/* Component Delete
 * Requires: web request, db connection
 * Returns: True if deleted, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  projects.get(req, db, req.body.project_id, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    db.del('project:' + req.body.project_id + ':screen:' + req.body.id + ':component:' + identifier,
      function(errComponent, component) {
        if (errComponent) {
          return callback(errComponent);
        }

        return callback(null, true);
      });
  });
};
