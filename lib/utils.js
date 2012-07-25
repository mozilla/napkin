const ALPHANUM_MATCH = /[^a-z0-9]+/gi;

// Various utility functions

/* Generate a unique id
 * Requires: web request, redis incremented id
 * Returns: A unique id
 */
exports.generateUniqueId = function(name, id) {
  // As a last resort, if name is unavailable let's set it to a timestamp
  if (typeof name === 'undefined') {
    name = new Date().getTime().toString();
  }

  return name.toString().toLowerCase().replace(ALPHANUM_MATCH, '_') + id;
};

/* Generically map curObject to req.body. If a property exists in curObject,
 *  req.body, and allowedFields, curObject's value is updated to equal
 *  req.body's value. If a property exists in req.body and allowedFields, but
 *  not in curObject, it is added to curObject with req.body's value.
 *
 * Requires: web request, current object, allowed fields
 * Returns: The updated object if it exists, else false
 */
exports.updateObject = function(req, curObject, allowedFields) {
  if (typeof curObject !== 'object') {
    curObject = JSON.parse(curObject);
  }

  if (curObject) {
    var setFields = function(curObject, from, allowedFields) {
      var props = Object.getOwnPropertyNames(from);
      var dest = curObject;

      // add from's properties that are in allowedFields
      props.forEach(function(name) {
        if (name in allowedFields) {
          // recursively apply allowedFields for sub-objects
          if (typeof allowedFields[name] === 'object') {
            if (!dest[name]) {
              dest[name] = {};
            }

            dest[name] = setFields(dest[name], from[name], allowedFields[name]);
          } else {
            var destination = Object.getOwnPropertyDescriptor(from, name);
            if (destination) {
              Object.defineProperty(dest, name, destination);
            }
          }
        }
      });

      return curObject;
    };

    return setFields(curObject, req.body, allowedFields);
  }

  return false;
};

/* Render a 404 response page.
 * Requires: web request, web response
 */
exports.render404 = function(req, res) {
  res.status(404);
  res.render('not-found', { pageId: 'not-found' });
};

/* Confirms that the current user is authenticated. If he/she is not,
 * redirects to 404 page. This is meant to be used as Express middleware.
 * Requires: web request, web response, next function to call when done
 */
exports.confirmAuthentication = function(req, res, next) {
  // sharedEmail acts as the session e-mail when on the share page
  if (req.session.email || req.sharedEmail) {
    next();
  } else {
    exports.render404(req, res);
  }
};

/* Confirms, via the returned middleware, that the ids in req correspond to
 * existing scaffolds. Also extracts the existing scaffolds into the request
 * object.
 *
 * Requires: db connection
 * Returns: express middleware in the form of a function that requires a web
 *  request, web response, next function to call when done
 */
exports.confirmScaffoldExistence = function(db) {
  return function(req, res, next) {
    var projects = require('./projects');
    var screens = require('./screens');

    var numCallbacks = 0;
    var numFinished = 0;
    var userId = req.session.sharedId || req.session.id;

    if (req.params.projectId) {
      numCallbacks++;

      projects.get(req, db, req.params.projectId, function(err, project) {
        if (err) {
          next(err);
        } else if (!project || project.authorId !== userId) {
          // if userId does not correspond to the project, this page is invalid
          exports.render404(req, res);
        } else {
          req.project = project;

          // have all callbacks finished?
          numFinished++;
          if (numFinished === numCallbacks) {
            next();
          }
        }
      });
    }

    if (req.params.screenId) {
      numCallbacks++;

      screens.get(req, db, req.params.screenId, function(err, screen) {
        if (err) {
          next(err);
        } else if (!screen) {
          exports.render404(req, res);
        } else {
          req.screen = screen;

          // have all callbacks finished?
          numFinished++;
          if (numFinished === numCallbacks) {
            next();
          }
        }
      });
    }
  };
};

/* Extract, via the returned middleware, a shared screen e-mail for use in REST
 * and db requests.
 *
 * Requires: db connection
 * Returns: express middleware in the form of a function that requires a web
 *  request, web response, next function to call when done
 */
exports.extractSharedEmail = function(db) {
  var users = require('./users');

  return function(req, res, next) {
    if (req.params.userId) {
      // this is a share page; store the shared id
      req.session.sharedId = req.params.userId;
    }

    if (req.session.sharedId) {
      // get shared e-mail from shared id
      users.getEmail(db, req.session.sharedId, function(err, email) {
        // TODO: handle error
        if (err) {
          next(err);
        } else {
          req.sharedEmail = email;
          next();
        }
      });
    } else {
      // already have this user's email in req.session.email
      next();
    }
  };
};

/* No operation placeholder for empty callbacks */
exports.noop = function() {};
