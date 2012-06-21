// All the Create / Read / Update / Delete commands

var utils = require('./utils');

/* Returns a list of the requested object
 * Requires: web request, key name, allowed fields, db connection
 * Returns: Object list if successful, error otherwise
 */
exports.list = function(req, keyName, allowedFields, db, callback) {
  var objectList = [];

  db.keys(keyName, function(err, objects) {
    if (err) {
      return callback(err);
    }

    objects.forEach(function(objectItem, counter) {
      db.get(objectItem, function(errObject, objectItem) {
        objectItem = JSON.parse(objectItem);

        var objectHash = utils.updateObject(req, objectItem, allowedFields);

        objectList.unshift(objectHash);

        if (counter === objects.length - 1) {
          return callback(null, objectList);
        }
      });
    });
  });
};

/* Gets an object
 * Requires: web request, key name, db connection
 * Returns: Object if successful, error otherwise
 */
exports.get = function(req, keyName, db, callback) {
  db.get(keyName, function(err, objectItem) {
    if (err || !objectItem) {
      return callback(err);
    }

    return callback(null, JSON.parse(objectItem));
  });
};

/* Adds an object
 * Requires: web request, key name, db connection
 * Returns: Object if successful, error otherwise
 */
exports.add = function(req, keyName, defaultValues, db, callback) {
  db.incr(keyName, function(err, id) {
    if (err) {
      return callback(err);
    }

    var identifier = id;

    var objectItem = defaultValues;
    objectItem.id = identifier;
    objectItem.identifier = utils.generateUniqueId(req.body.title, identifier),

    keyName = keyName + ':' + identifier;

    db.set(keyName, JSON.stringify(objectItem), function(errAddObject, response) {
      if (errAddObject) {
        return callback(errAddObject);
      }

      db.get(keyName, function(errObject, objectItem) {
        if (errObject || !objectItem) {
          return callback(errObject);
        }

        return callback(null, JSON.parse(objectItem));
      });
    });
  });
};

/* Updates an object
 * Requires: web request, key name, allowed fields, db connection
 * Returns: True if successful, error otherwise
 */
exports.update = function(req, keyName, allowedFields, db, callback) {
  db.get(keyName, function(err, objectItem) {
    if (err || !objectItem) {
      return callback(err);
    }

    var updatedObject = utils.updateObject(req, objectItem, allowedFields);
    
    db.set(keyName, updatedObject, function(errSet) {
      if (errSet) {
        return callback(errSet);
      }

      return callback(null, updatedObject);
    });
  });
};

/* Deletes an object
 * Requires: web request, key name, db connection
 * Returns: True if successful, error otherwise
 */
exports.remove = function(req, keyName, db, callback) {
  db.del(keyName, function(err) {
    if (err) {
      return callback(err);
    }

    return callback(null, true);
  });
};
