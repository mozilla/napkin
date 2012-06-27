/*globals exports:true*/
const ALLOWED_FIELDS = {
        title: undefined,
        author: undefined
      };

var scaffold = require('./scaffold');

/* Get Default Project
 * Requires: web request
 * Returns: default project data
 */
function getDefaultProject(req) {
  return {
    title: req.body.title,
    author: req.session.email,
    created: new Date().getTime()
  };
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
    'projects', getDefaultProject, ALLOWED_FIELDS);
