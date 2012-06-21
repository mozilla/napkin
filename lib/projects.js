const ALLOWED_FIELDS = {
        title: undefined,
        author: undefined
      };

var crud = require('./crud');

/* Project List
 * Requires: web request, db connection
 * Returns: A listing of the user's projects
 */
exports.list = function(req, db, callback) {
  crud.list(req, 'project:' + req.session.email + ':*', ALLOWED_FIELDS, db, function(err, projectList) {
    if (err) {
      return callback(err);
    }

    return callback(null, projectList);
  });
};

/* Project Get
 * Requires: web request, db connection, identifier
 * Returns: A project object if found, error if not found
 */
exports.get = function(req, db, identifier, callback) {
  crud.get(req, 'project:' + req.session.email + ':' + identifier, db, function(err, project) {
    if (err) {
      return callback(err);
    }

    return callback(null, project);
  });
};

/* Project Add
 * Requires: web request, db connection
 * Returns: Project object if successful, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  var defaultValues = {
    title: req.body.title,
    author: req.session.email,
    created: new Date().getTime()
  };

  crud.add(req, 'project:' + req.session.email, defaultValues, db, function(err, project) {
    if (err) {
      return callback(err);
    }

    return callback(null, project);
  });
};

/* Project Update
 * Requires: web request, db connection, identifier
 * Returns: Project object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  crud.update(req, 'project:' + req.session.email + ':' + identifier, ALLOWED_FIELDS, db, function(err, project) {
    if (err) {
      return callback(err);
    }

    return callback(null, project);
  });
};

/* Project Delete
 * Requires: web request, db connection
 * Returns: True if deleted, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  crud.remove(req, 'project:' + req.session.email + ':' + identifier, db, function(err, status) {
    if (err) {
      return callback(err);
    }

    return callback(null, status);
  });
};
