const ALLOWED_FIELDS = {
        title: undefined,
        identifier: undefined,
        required: undefined,
        layout: undefined,
        src: undefined
      };

var crud = require('./crud');

/* Element List Per Component
 * Requires: web request, db connection
 * Returns: A listing of the user's elements within a component
 */
exports.list = function(req, db, callback) {
  crud.list(req, 'project:' + req.body.project_id + ':component:' + req.params.id + ':element:*',
    ALLOWED_FIELDS, db, function(err, elementList) {
    
    if (err) {
      return callback(err);
    }

    return callback(null, elementList);
  });
};

/* Element Add
 * Requires: web request, db connection
 * Returns: Element object if successful, false if email doesn't match, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  var defaultValues = {
    type: req.body.type,
    title: req.body.title,
    layout: req.body.layout,
    required: req.body.required || false,
    src: req.body.src
  };

  crud.add(req, 'project:' + req.body.project_id + ':component:' + req.params.id + ':element',
    defaultValues, db, function(err, element) {
    
    if (err) {
      return callback(err);
    }

    return callback(null, element);
  });
};

/* Element Update
 * Requires: web request, db connection, identifier
 * Returns: Element object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  crud.update(req, 'project:' + req.body.project_id + ':component:' + req.params.id + ':element:' + identifier,
    ALLOWED_FIELDS, db, function(err, element) {
    
    if (err) {
      return callback(err);
    }

    return callback(null, element);
  });
};

/* Element Delete
 * Requires: web request, db connection
 * Returns: True if deleted, false if email doesn't match, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  crud.remove(req, 'project:' + req.body.project_id + ':componenet:' + req.params.id + ':element:' + identifier,
    db, function(err, status) {
    
    if (err) {
      return callback(err);
    }

    return callback(null, status);
  });
};
