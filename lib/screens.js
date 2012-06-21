const ALLOWED_FIELDS = {
        title: undefined,
        is_start: undefined,
        layout: undefined
      };

var crud = require('./crud');

/* Screen List Per Project
 * Requires: web request, db connection
 * Returns: A listing of the user's screens within a project
 */
exports.list = function(req, db, callback) {
  crud.list(req, 'project:' + req.params.id + ':screen:*', ALLOWED_FIELDS, db, function(err, screenList) {
    if (err) {
      return callback(err);
    }

    return callback(null, screenList);
  });
};

/* Screen Get
 * Requires: web request, db connection, identifier
 * Returns: A screen object if found, error if not found
 */
exports.get = function(req, db, identifier, callback) {
  crud.get(req, 'project:' + req.params.id + ':screen:' + identifier, db, function(err, screen) {
    if (err) {
      return callback(err);
    }

    return callback(null, screen);
  });
};

/* Screen Add
 * Requires: web request, db connection
 * Returns: Screen object if successful, false if email doesn't match, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  var defaultValues = {
    title: req.body.title,
    is_start: req.body.is_start,
    layout: req.body.layout
  };

  crud.add(req, 'project:' + req.params.id + ':screen', defaultValues, db, function(err, screen) {
    if (err) {
      return callback(err);
    }

    return callback(null, screen);
  });
};

/* Screen Update
 * Requires: web request, db connection, identifier
 * Returns: Screen object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  crud.update(req, 'project:' + req.params.id + ':screen:' + identifier, ALLOWED_FIELDS, db, function(err, screen) {
    if (err) {
      return callback(err);
    }

    return callback(null, screen);
  });
};

/* Screen Delete
 * Requires: web request, db connection
 * Returns: True if deleted, false if email doesn't match, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  crud.remove(req, 'project:' + req.params.id + ':screen:' + identifier, db, function(err, status) {
    if (err) {
      return callback(err);
    }

    return callback(null, status);
  });
};
