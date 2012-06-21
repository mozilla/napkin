const ALLOWED_FIELDS = {
        layout: undefined,
        action: undefined
      };

var crud = require('./crud');

/* Component List Per Screen
 * Requires: web request, db connection
 * Returns: A listing of the user's components within a screen
 */
exports.list = function(req, db, callback) {
  crud.list(req, 'project:' + req.body.project_id + ':screen:' + req.params.id + ':component:*',
    ALLOWED_FIELDS, db, function(err, componentList) {
    
    if (err) {
      return callback(err);
    }

    return callback(null, componentList);
  });
};

/* Component Add
 * Requires: web request, db connection
 * Returns: Component object if successful, false if email doesn't match, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  var defaultValues = {
    type: req.body.type,
    layout: req.body.layout,
    action: req.body.action
  };

  crud.add(req, 'project:' + req.body.project_id + ':screen:' + req.params.id + ':component',
    defaultValues, db, function(err, component) {

    if (err || !component) {
      return callback(err);
    }

    return callback(null, component);
  });
};

/* Component Update
 * Requires: web request, db connection, identifier
 * Returns: Component object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  crud.update(req, 'project:' + req.body.project_id + ':screen:' + req.params.id + ':component:' + identifier,
    ALLOWED_FIELDS, db, function(err, component) {

    if (err) {
      return callback(err);
    }

    return callback(null, component);
  });
};

/* Component Delete
 * Requires: web request, db connection
 * Returns: True if deleted, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  crud.remove(req, 'project:' + req.body.project_id + ':screen:' + req.params.id + ':component:' + identifier,
    db, function(err, status) {

    if (err) {
      return callback(err);
    }

    return callback(null, status);
  });
};
