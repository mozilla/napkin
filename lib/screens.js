/*globals exports:true*/
const ALLOWED_FIELDS = {
        title: undefined,
        is_start: undefined,
        layout: undefined
      };

var scaffold = require('./scaffold');

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

exports = module.exports = scaffold.generate(['projects'], ['components'],
    'screens', getDefaultScreen, ALLOWED_FIELDS);
