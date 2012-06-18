const ALLOWED_FIELDS = {
        title: undefined,
        author: undefined
      };

var utils = require('./utils');

/* Project List
 * Requires: web request, db connection
 * Returns: A listing of the user's projects
 */
exports.list = function(req, db, callback) {
  var projectList = [];

  db.keys('project:' + req.session.email + ':*', function(err, projects) {
    if (err) {
      return callback(err);
    }

    try {
      var getProjects = function(project, counter) {
        db.get(project, function(errProject, project) {
          project = JSON.parse(project);

          var projectHash = {
            title: project.title,
            author: project.author
          };

          projectList.unshift(projectHash);

          if (counter === projects.length - 1) {
            return callback(null, projectList);
          }
        });
      };

      projects.forEach(getProjects);
    } catch(err) {
      return callback(err);
    }
  });
};

/* Project Get
 * Requires: web request, db connection, identifier
 * Returns: A project object if found, error if not found
 */
exports.get = function(req, db, identifier, callback) {
  db.get('project:' + req.session.email + ':' + identifier, function(err, project) {
    if (err) {
      return callback(err);
    }

    return callback(null, JSON.parse(project));
  });
};

/* Project Add
 * Requires: web request, db connection
 * Returns: Project object if successful, error if unsuccessful
 */
exports.add = function(req, db, callback) {
  db.incr('project:' + req.session.email, function(err, id) {
    if (err) {
      return callback(err);
    }

    var identifier = id;

    var project = {
      id: identifier,
      title: req.body.title,
      author: req.session.email,
      created: new Date().getTime()
    };

    db.set('project:' + req.session.email + ':' + identifier, JSON.stringify(project), function(errAddProj) {
      if (errAddProj) {
        return callback(errAddProj);
      }

      db.get('project:' + req.session.email + ':' + identifier, function(errProj, project) {
        if (errProj) {
          return callback(errProj);
        }

        return callback(null, JSON.parse(project));
      });
    });
  });
};

/* Project Update
 * Requires: web request, db connection, identifier
 * Returns: Project object if successful, false if email doesn't match, error if unsuccessful
 */
exports.update = function(req, db, identifier, callback) {
  var projectKey = 'project:' + req.session.email + ':' + identifier;

  db.get(projectKey, function(err, project) {
    if (err) {
      return callback(err);
    } else if (!project) {
      return callback(null, false);
    }

    var updatedProject = utils.updateObject(req, project, ALLOWED_FIELDS);

    db.set(projectKey, updatedProject);

    return callback(null, updatedProject);
  });
};

/* Project Delete
 * Requires: web request, db connection
 * Returns: True if deleted, error if unsuccessful
 */
exports.remove = function(req, db, identifier, callback) {
  db.del('project:' + req.session.email + ':' + identifier, function(err, project) {
    if (err) {
      return callback(err);
    }

    return callback(null, true);
  });
};
