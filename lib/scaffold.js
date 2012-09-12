var crud = require('./crud');
var utils = require('./utils');
var users = require('./users');

/* Generate a CRUD scaffold for an object
 *
 * Requires:
 *  parents - the scaffolds that are parents of this scaffold
 *    i.e. ['projects', 'screens']
 *  children - the scaffolds that are direct children of this scaffold
 *    i.e. ['elements']
 *  name - the name of this scaffold
 *    i.e. 'components'
 *  getDefault - function(req) which returns a default object based on
 *    a request
 *  allowedFields - fields that are allowed to be modified in the form of
 *    a map
 *  validateRequest - function(req, beingCreated, db, callback) which determines
 *    whether the POST values in the given request are valid for creating or
 *    updating this object. beingCreated will be true if the object is being
 *    created or false if it is being updated. validateRequest should call
 *    the given callback when finished with an error message as the first
 *    parameter if there were validation issues or no parameters otherwise
 *
 * Returns: the scaffold in the form of an object with the following methods:
 *  list(req, db, callback) - get a list of the scaffolded objects
 *  get(req, db, identifier, callback) - get a specific object
 *  add(req, db, callback) - add an object
 *  update(req, db, identifier, callback) - update an object
 *  remove(req, db, identifier, callback) - remove an object
 */
exports.generate = function(parents, children, name, getDefault,
                            allowedFields, validateRequest) {
  var scaffold = {};

  /* Get hash key
   * Requires: web request
   * Returns: database key for objects hash
   */
  function getHashKey(req) {
    // sharedEmail is not stored in the client session for security purposes;
    // users should not be able to see the e-mail of others
    var key = req.sharedEmail || req.session.email;
    key = key + ':';

    var parentKeys = parents.map(function(parentName) {
      var singularName = parentName.substring(0, parentName.length - 1);
      return parentName + ':' + req.params[singularName + 'Id'];
    });

    if (parentKeys.length > 0) {
      parentKeys[parentKeys.length - 1] += ':';
    }

    return key + parentKeys.join(':') + name;
  }

  /* Object list
   * Requires: web request, db connection, callback
   * Calls: callback(error, objectList):
   *  error - null if object list was retrieved or an error otherwise
   *  objectList - if error is null, the list of objects
   */
  scaffold.list = function(req, db, callback) {
    var key = getHashKey(req);
    crud.list(key, db, function(err, objectList) {
      if (err) {
        callback(err);
      } else {
        callback(null, objectList);
      }
    });
  };

  /* Object get
   * Requires: web request, db connection, id, callback
   * Calls: callback(error, object):
   *  error - null if object was retrieved or an error otherwise
   *  object - if error is null, the object
   */
  scaffold.get = function(req, db, id, callback) {
    var key = getHashKey(req);
    crud.get(key, id, db, function(err, object) {
      if (err) {
        callback(err);
      } else {
        callback(null, object);
      }
    });
  };

  /* Object add
   * Requires: web request, db connection, callback
   * Calls: callback(error, object):
   *  error - null if the object was added or an error otherwise
   *  object - if error is null, the object that was added
   */
  scaffold.add = function(req, db, callback) {
    var defaultValues = getDefault(req);
    var key = getHashKey(req);
    callback = callback || utils.noop;

    crud.add(req, key, defaultValues, db, function(err, object) {
      if (err) {
        callback(err);
      } else {
        callback(null, object);
      }
    });
  };

  /* Object update
   * Requires: web request, db connection, id, callback
   * Calls: callback(error, object):
   *  error - null if object was updated or error otherwise
   *  object - if error is null, the object that was updated
   */
  scaffold.update = function(req, db, id, callback) {
    var key = getHashKey(req);
    callback = callback || utils.noop;

    crud.update(req, key, id, allowedFields, db,
      function(err, object) {
        if (err) {
          callback(err);
        } else {
          callback(null, object);
        }
      });
  };

  /* Object remove
   * Requires: web request, db connection, id, callback
   * Calls: callback(error):
   *  error - null if the object was removed or an error otherwise
   */
  scaffold.remove = function(req, db, id, callback) {
    var key = getHashKey(req);
    callback = callback || utils.noop;
    id = String(id);

    // set up the request to remove child scaffolds
    var childReq = req;
    var singularName = name.substring(0, name.length - 1);

    if (!childReq.params) {
        childReq.params = {};
    }

    // set up the id of the current object being removed for access by child
    // scaffolds
    childReq.params[singularName + 'Id'] = id;

    // statistics for determining when deletion is complete
    var objectsRemoved = 0;
    var numChildrenProcessed = 0;
    var numObjects = 0;

    // remove handler for deleting child scaffold objects
    function removeHandler(err) {
      if (err) {
        callback(err);
      } else {
        objectsRemoved++;
        if (numChildrenProcessed === children.length &&
            objectsRemoved === numObjects) {
          crud.remove(key, id, db, function(err, status) {
            callback(err);
          });
        }
      }
    }

    // if there is nothing to remove, immediately call the remove handler
    if (children.length === 0) {
      // set to one so that the handler thinks it has removed all objects
      numObjects = 1;
      removeHandler(null);
    }

    // remove objects in child scaffolds that correspond to this object
    children.forEach(function(childName) {
      var childScaffold = require('./' + childName);

      // key is in the form project:screen:components; want to get it in
      // the form project:screen:component:elements
      var childKey = key.substr(0, key.length - 1);
      childKey += ':' + id + ':' + childName;

      db.hlen(childKey, function(err, length) {
        numObjects += length;
        numChildrenProcessed++;

        // there are no children to remove
        if (numChildrenProcessed === children.length && numObjects === 0) {
          numObjects = 1;
          removeHandler(null);
        }

        if (err) {
          callback(err);
        } else {
          for (var i = 1; i <= length; i++) {
            childScaffold.remove(childReq, db, i, removeHandler);
          }
        }
      });
    });
  };

  /* Generate REST routes for this scaffold
   * Requires: application, db connection, express middleware to insert into routes
   */
  scaffold.generateRESTRoutes = function(app, db, middleware) {
    var baseRoute = '/';

    // construct base route to be in the form /project/:projectId/screens
    var parentKeys = parents.map(function(parentName) {
      var singularName = parentName.substring(0, parentName.length - 1);
      return parentName + '/:' + singularName + 'Id';
    });

    if (parentKeys.length > 0) {
      parentKeys[parentKeys.length - 1] += '/';
    }

    baseRoute += parentKeys.join('/') + name;

    var that = this;
    var extractSharedEmail = utils.extractSharedEmail(db);

    // GET should read
    app.get(baseRoute + '/:id?', extractSharedEmail, middleware, function(req, res) {
      if (!req.params.id) {
        // if no id is specified, then return a list of all objects
        that.list(req, db, function(err, objectList) {
          if (err) {
            // TODO: how to handle error?
            throw err;
          } else {
            res.send(objectList);
          }
        });
      } else {
        // otherwise return a specific object
        that.get(req, db, req.params.id, function(err, object) {
          if (err) {
            throw err;
          } else {
            res.send(object);
          }
        });
      }
    });

    // POST should create
    app.post(baseRoute, middleware, function(req, res) {
      var result = validateRequest(req, true, db, function(err) {
        if (err) {
          res.send(err, 400);
        } else {
          that.add(req, db, function(err, object) {
            if (err) {
              throw err;
            } else {
              res.send(object);
            }
          });
        }
      });
    });

    // PUT should update
    app.put(baseRoute + '/:id', middleware, function(req, res) {
      var result = validateRequest(req, false, db, function(err) {
        if (err) {
          res.send(err, 400);
        } else {
          that.update(req, db, req.params.id, function(err, object) {
            if (err) {
              throw err;
            } else {
              res.send(object);
            }
          });
        }
      });
    });

    // DELETE should remove
    app.del(baseRoute + '/:id', middleware, function(req, res) {
      that.remove(req, db, req.params.id, function(err) {
        if (err) {
          throw err;
        } else {
          // sends a "204 No Content" status code
          res.send();
        }
      });
    });
  };

  return scaffold;
};
