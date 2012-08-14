/*globals exports:true*/
const ALLOWED_FIELDS = {
  title: undefined
};

var scaffold = require('./scaffold');

/* Get default project
 * Requires: web request
 * Returns: default project data
 */
function getDefaultProject(req) {
  return {
    title: req.body.title,
    author: req.session.email,
    authorId: req.session.id,
    created: new Date().getTime()
  };
}

/* Validate project
 * Requires:
 *  req - web request,
 *  beingCreated - true if this project is being created for the first time and
 *    false otherwise,
 *  db - db connection,
 *  callback
 * Calls: callback([error]):
 *  error - if there was a validation issue, this is an error message that
 *    explains it; otherwise, this argument is not provided.
 */
function validateProject(req, beingCreated, db, callback) {
  var title = req.body.title;
  var id = parseInt(req.params.id, 10);

  if (!title) {
    callback('Project must have a title.');
    return;
  } else if (title.length < 1 || title.length > 20) {
    callback('Project must have a title between 1 and 20 characters long.');
    return;
  }

  exports.list(req, db, function(err, projectList) {
    if (err) {
      throw err;
    } else {
      for (var i = 0; i < projectList.length; i++) {
        if (projectList[i].title.toLowerCase() === title.toLowerCase() &&
            // confirm that we aren't looking at the exact same project
            (beingCreated || projectList[i].id !== id)) {
          callback('Project must have a unique case-insensitive title.');
          return;
        }
      }

      // everything has been validated; there are no errors
      callback();
    }
  });
}

/* 
 * Directly assigning `exports` alone won't do anything, as node only exports
 * the properties of `exports` and not a reassigned object. Assigning
 * `module.exports`, however, will force node to export the reassigned object.
 * It is still necessary to assign `exports` back to `module.exports` so that
 * it is referencing the newly updated exports object; in this way, the user
 * can continue to use `exports.someProperty = someValue;` and have
 * someProperty exported by node.
 */
exports = module.exports = scaffold.generate([], ['screens'],
  'projects', getDefaultProject, ALLOWED_FIELDS, validateProject);
