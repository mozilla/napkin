const ALLOWED_FIELDS = {
        name: undefined,
        identifier: undefined,
        required: undefined,
        layout: undefined,
        src: undefined
      };

var projects = require('./projects');
var components = require('./components');
var utils = require('./utils');

/* Element List Per Component
 * Requires: web request, db connection
 * Returns: A listing of the user's elements within a component
 */
exports.list = function(req, db, callback) {
  var elementList = [];

  db.keys('project:' + req.body.project_id + ':component:' + req.params.id + ':element:*', function(err, elements) {
    if (err) {
      return callback(err);
    }

    try {
      var getElements = function(element, counter) {
        db.get(element, function(errElement, element) {
          element = JSON.parse(element);
          var elementHash = {
            type: element.type,
            name: element.name,
            layout: element.layout,
            required: element.required,
            src: element.src
          };

          elementList.unshift(elementHash);

          if (counter === elements.length - 1) {
            return callback(null, elementList);
          }
        });
      };

      elements.forEach(getElements);
    } catch(err) {
      return callback(err);
    }
  });
};

/* Element Add
 * Requires: web request, db connection
 * Returns: Element object if successful, false if email doesn't match, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  projects.get(req, db, req.body.project_id, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    db.incr('project:' + req.body.project_id + ':component:' + req.body.id + ':element', function(errIncr, id) {
      if (errIncr) {
        return callback(errIncr);
      }

      var identifier = id;

      var element = {
        id: identifier,
        identifier: utils.generateUniqueId(req.body.name, identifier),
        type: req.body.type,
        name: req.body.name,
        layout: req.body.layout,
        required: req.body.required || false,
        src: req.body.src
      };

      db.set('project:' + req.body.project_id + ':component:' + req.body.id + ':element:' + identifier, JSON.stringify(element),
        function(errAddElement) {
          if (errAddElement) {
            return callback(errAddElement);
          }

          db.get('project:' + req.body.project_id + ':component:' + req.body.id + ':element:' + identifier,
            function(errElement, newElement) {
              if (errElement) {
                return callback(errElement);
              }

              return callback(null, JSON.parse(newElement));
            });
        });
    });
  });
};

/* Element Update
 * Requires: web request, db connection, identifier
 * Returns: Element object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  projects.get(req, db, req.body.project_id, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    var elementKey = 'project:' + req.body.project_id + ':component:' + req.body.id + ':element:' + identifier;

    db.get(elementKey, function(errElement, element) {
      if (errElement) {
        return callback(errElement);
      }

      var updatedElement = utils.updateObject(req, element, ALLOWED_FIELDS);

      db.set(elementKey, updatedElement, function(errElement) {
        if (errElement) {
          return callback(errElement);
        }

        return callback(null, updatedElement);
      });
    });
  });
};

/* Element Delete
 * Requires: web request, db connection
 * Returns: True if deleted, false if email doesn't match, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  projects.get(req, db, req.body.project_id, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    db.del('project:' + req.body.project_id + ':componenet:' + req.body.id + ':element:' + identifier,
      function(errElement, element) {
        if (errElement) {
          return callback(errElement);
        }

        return callback(null, true);
      });
  });
};
