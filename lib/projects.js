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
 *    false otherwise
 * Returns: true if the request is valid to create/update a project
 *  or an error message otherwise
 */
function validateProject(req, beingCreated) {
  var title = req.body.title;

  if (!title) {
    return 'Project must have a title.';
  } else if (title.length < 1 || title.length > 20) {
    return 'Project must have a title between 1 and 20 characters long.';
  }
  return true;
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
