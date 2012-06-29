// All the Create / Read / Update / Delete commands

var utils = require('./utils');

/* Object list
 * Requires: key, allowed fields, db connection, callback
 * Calls: callback(error, objectList):
 *  error - null if object list was retrieved or an error otherwise
 *  objectList - if error is null, the list of objects
 */
exports.list = function(key, db, callback) {
  db.hvals(key, function(err, objectList) {
    if (err) {
      callback(err);
    } else if (objectList.length === 0) {
      callback(null, objectList);
    } else {
      objectList = objectList.map(function(object) {
        return JSON.parse(object);
      });

      callback(null, objectList);
    }
  });
};

/* Gets an object
 * Requires: key, id, db connection, callback
 * Calls: callback(error, object):
 *  error - null if object was retrieved or an error otherwise
 *  object - if error is null, the object
 */
exports.get = function(key, id, db, callback) {
  // ensure id is a string
  id = String(id);
  db.hget(key, id, function(err, object) {
    if (err) {
      callback(err);
    } else {
      callback(null, JSON.parse(object));
    }
  });
};

/* Adds an object
 * Requires: web request, key, default values, db connection, callback
 * Calls: callback(error, object):
 *  error - null if the object was added or an error otherwise
 *  object - if error is null, the object that was added
 */
exports.add = function(req, key, defaultValues, db, callback) {
  callback = callback || utils.noop;
  db.incr(key + ':id', function(err, id) {
    if (err) {
      callback(err);
    } else {
      var object = defaultValues;
      object.id = id; // ids are 1-indexed

      var value = JSON.stringify(object);
      db.hset(key, String(object.id), value, function(err, status) {
        if (err) {
          callback(err);
        } else if (!status) {
          callback(new Error('Object already exists in database; ' +
            "It's value was updated instead of added."));
        } else {
          callback(null, object);
        }
      });
    }
  });
};

/* Updates an object
 * Requires: web request, key, id, allowed fields, db connection, callback
 * Calls: callback(error, object):
 *  error - null if object was updated or error otherwise
 *  object - if error is null, the object that was updated
 */
exports.update = function(req, key, id, allowedFields, db, callback) {
  callback = callback || utils.noop;
  id = String(id);

  this.get(key, id, db, function(err, object) {
    if (err) {
      callback(err);
    } else if (!object) {
      callback(new Error('Cannot update object that does not exist.'));
    } else {
      var updatedObject = utils.updateObject(req, object, allowedFields);
      var value = JSON.stringify(updatedObject);

      db.hset(key, id, value, function(errSet, status) {
        if (errSet) {
          callback(errSet);
        } else {
          // status can be ignored because the id must exist to get here
          callback(null, updatedObject);
        }
      });
    }
  });
};

/* Removes an object
 * Requires: key, id, db connection, callback
 * Calls: callback(error):
 *  error - null if the object was removed or an error otherwise
 */
exports.remove = function(key, id, db, callback) {
  callback = callback || utils.noop;
  db.hdel(key, id, function(err, numRemoved) {
    if (err) {
      callback(err);
    } else if (numRemoved != 1) {
      callback(new Error('Asked to delete one object, but ' + numRemoved +
        ' objects were actually removed.'));
    } else {
      callback(null);
    }
  });
};
