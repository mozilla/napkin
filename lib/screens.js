const ALLOWED_FIELDS = {
        title: undefined,
        is_start: undefined,
        layout: undefined
      };

var scaffold = require('./scaffold');

/* Get Screen Prefix
 * Requires: web request
 * Returns: database prefix for screen
 */
function getScreenPrefix(req) {
  return 'project:' + req.session.email + ':screen';
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

exports = module.exports = scaffold.generate(getScreenPrefix,
    getDefaultScreen, ALLOWED_FIELDS);
