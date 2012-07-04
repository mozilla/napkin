/*globals exports:true*/
const ALLOWED_FIELDS = {
        title: undefined,
        is_start: undefined,
        layout: undefined
      };

var scaffold = require('./scaffold');

/* Get default screen
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

/* Validate screen
 * Requires:
 *  req - web request,
 *  beingCreated - true if this screen is being created for the first time and
 *    false otherwise
 * Returns: true if the request is valid to create/update a screen
 *  or an error message otherwise
 */
function validateScreen(req, beingCreated) {
  var title = req.body.title;

  /* TODO: validate is_start and layout */
  if (!title || title.length === 0) {
    return 'Screen must have a title.';
  } else if (title.length > 25) {
    return 'Screen must have a title less than 25 characters long.';
  }
  return true;
}

exports = module.exports = scaffold.generate(['projects'], ['components'],
    'screens', getDefaultScreen, ALLOWED_FIELDS, validateScreen);
