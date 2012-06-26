const ALLOWED_FIELDS = {
        title: undefined,
        is_start: undefined,
        layout: undefined
      };

var scaffold = require('./scaffold');

/* Get Screens Key
 * Requires: web request
 * Returns: database key for screen hash
 */
function getScreensKey(req) {
  return req.session.email + ':project:' + req.params.project_id + ':screens';
}

/* Get Default Screen
 * Requires: web request
 * Returns: default screen data
 */
function getDefaultScreen(req) {
  return {
    title: req.body.title,
    is_start: req.body.is_start,
    layout: req.body.layout
  };
}

exports = module.exports = scaffold.generate(getScreensKey,
    getDefaultScreen, ALLOWED_FIELDS);
