// All the Create / Read / Update / Delete commands

var utils = require('./utils');

/* Object list
 * Requires: key name, allowed fields, db connection, callback
 * Calls: callback(error, objectList):
 *  error - null if object list was retrieved or an error otherwise
 *  objectList - if error is null, the list of objects
 */
exports.list = function(keyName, allowedFields, db, callback) {
  var objectList = [];

  db.keys(keyName, function(err, objects) {
    if (err) {
      callback(err);
    }
    else if (objects.length === 0) {
      callback(null, objectList);
    }
    else {
      objects.forEach(function(objectItem, counter) {
        db.get(objectItem, function(errObject, objectItem) {
          objectItem = JSON.parse(objectItem);
          objectList.unshift(objectItem);

          if (counter === objects.length - 1) {
            callback(null, objectList);
          }
        });
      });
    }
  });
};

/* Gets an object
 * Requires: key name, db connection, callback
 * Calls: callback(error, object):
 *  error - null if object was retrieved or an error otherwise
 *  object - if error is null, the object
 */
exports.get = function(keyName, db, callback) {
  db.get(keyName, function(err, objectItem) {
    if (err || !objectItem) {
      callback(err);
    }
    else {
      callback(null, JSON.parse(objectItem));
    }
  });
};

/* Adds an object
 * Requires: web request, key name, db connection, callback
 * Calls: callback(error, object):
 *  error - null if the object was added or an error otherwise
 *  object - if error is null, the object that was added
 */
exports.add = function(req, keyName, defaultValues, db, callback) {
  callback = callback || utils.placeholder;
  db.incr(keyName, function(err, id) {
    if (err) {
      callback(err);
    }
    else {
      var identifier = id;
      var objectItem = defaultValues;

      objectItem.id = identifier;
      objectItem.identifier = utils.generateUniqueId(req.body.title, identifier),
      keyName = keyName + ':' + identifier;

      db.set(keyName, JSON.stringify(objectItem), function(errAddObject, response) {
        if (errAddObject) {
          callback(errAddObject);
        }
        else {
          db.get(keyName, function(errObject, objectItem) {
            if (errObject || !objectItem) {
              callback(errObject);
            }
            else {
              callback(null, JSON.parse(objectItem));
            }
          });
        }
      });
    }
  });
};

/* Updates an object
 * Requires: web request, key name, allowed fields, db connection, callback
 * Calls: callback(error, object):
 *  error - null if object was updated or error otherwise
 *  object - if error is null, the object that was updated
 */
exports.update = function(req, keyName, allowedFields, db, callback) {
  callback = callback || utils.placeholder;
  db.get(keyName, function(err, objectItem) {
    if (err || !objectItem) {
      callback(err);
    }
    else {
      var updatedObject = utils.updateObject(req, objectItem, allowedFields);
      db.set(keyName, JSON.stringify(updatedObject), function(errSet) {
        if (errSet) {
          callback(errSet);
        }
        else {
          callback(null, updatedObject);
        }
      });
    }
  });
};

/* Removes an object
 * Requires: key name, db connection, callback
 * Calls: callback(error):
 *  error - null if the object was removed or an error otherwise
 */
exports.remove = function(keyName, db, callback) {
  callback = callback || utils.placeholder;
  db.del(keyName, function(err) {
    callback(err);
  });
};
