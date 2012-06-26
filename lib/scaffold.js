var crud = require('./crud');
var utils = require('./utils');

/* Generate a CRUD scaffold for an object
 *
 * Requires:
 *  getPrefix - function(req) which returns a prefix based on a request
 *  getDefault - function(req) which returns a default object based on
 *    a request
 *  allowedFields - fields that are allowed to be modified in the form of
 *    a map
 *
 * Returns: the scaffold in the form of an object with the following methods:
 *  list(req, db, callback) - get a list of the scaffolded objects
 *  get(req, db, identifier, callback) - get a specific object
 *  add(req, db, callback) - add an object
 *  update(req, db, identifier, callback) - update an object
 *  remove(req, db, identifier, callback) - remove an object
 */
exports.generate = function(getPrefix, getDefault, allowedFields) {
  var scaffold = {};

  /* Object List
   * Requires: web request, db connection, callback
   * Calls: callback(error, objectList):
   *  error - null if object list was retrieved or an error otherwise
   *  objectList - if error is null, the list of objects
   */
  scaffold.list = function(req, db, callback) {
    var key = getPrefix(req) + ':*';
    crud.list(key, allowedFields, db, function(err, objectList) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, objectList);
      }
    });
  };

  /* Object Get
   * Requires: web request, db connection, identifier, callback
   * Calls: callback(error, object):
   *  error - null if object was retrieved or an error otherwise
   *  object - if error is null, the object
   */
  scaffold.get = function(req, db, identifier, callback) {
    var key = getPrefix(req) + ':' + identifier;
    crud.get(key, db, function(err, object) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, object);
      }
    });
  };

  /* Object Add
   * Requires: web request, db connection, callback
   * Calls: callback(error, object):
   *  error - null if the object was added or an error otherwise
   *  object - if error is null, the object that was added
   */
  scaffold.add = function(req, db, callback) {
    var defaultValues = getDefault(req);
    var key = getPrefix(req);

    callback = callback || utils.placeholder;
    crud.add(req, key, defaultValues, db, function(err, object) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, object);
      }
    });
  };

  /* Object Update
   * Requires: web request, db connection, identifier, callback
   * Calls: callback(error, object):
   *  error - null if object was updated or error otherwise
   *  object - if error is null, the object that was updated
   */
  scaffold.update = function(req, db, identifier, callback) {
    var key = getPrefix(req) + ':' + identifier;
    callback = callback || utils.placeholder;

    crud.update(req, key, allowedFields, db, function(err, project) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, project);
      }
    });
  };

  /* Object Remove
   * Requires: web request, db connection, callback
   * Calls: callback(error):
   *  error - null if the object was removed or an error otherwise
   */
  scaffold.remove = function(req, db, identifier, callback) {
    var key = getPrefix(req) + ':' + identifier;
    callback = callback || utils.placeholder;

    crud.remove(key, db, function(err, status) {
      callback(err);
    });
  };

  return scaffold;
};
