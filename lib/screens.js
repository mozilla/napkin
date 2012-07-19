/*globals exports:true*/
const ALLOWED_FIELDS = {
  title: undefined,
  isStart: undefined,
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
    isStart: req.body.isStart,
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

  // TODO: validate isStart and layout
  if (!title) {
    return 'Screen must have a title.';
  } else if (title.length < 1 || title.length > 20) {
    return 'Screen must have a title between 1 than 20 characters long.';
  }
  return true;
}

exports = module.exports = scaffold.generate(['projects'], ['components'],
  'screens', getDefaultScreen, ALLOWED_FIELDS, validateScreen);
