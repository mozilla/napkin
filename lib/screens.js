/*globals exports:true*/
const ALLOWED_FIELDS = {
  title: undefined,
  isStart: undefined,
  layout: undefined,
  secure: undefined
};

var scaffold = require('./scaffold');

/* Get default screen
 * Requires: web request
 * Returns: default screen data
 */
function getDefaultScreen(req) {
  return {
    title: req.body.title,
    isStart: req.body.isStart || false,
    layout: req.body.layout,
    secure: req.body.secure || false
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
  var body = req.body;
  var title = body.title;
  var isStart = body.isStart;
  var secure = body.secure;

  // TODO: validate isStart and layout
  if (!title) {
    return 'Screen must have a title.';
  } else if (title.length < 1 || title.length > 20) {
    return 'Screen must have a title between 1 than 20 characters long.';
  }
  
  if (isStart !== undefined) {
    if (isStart === 'true') {
      body.isStart = isStart = true;
    } else if (isStart === 'false') {
      body.isStart = isStart = false;
    }

    if (typeof isStart !== 'boolean') {
      return 'Screen must have an isStart boolean.';
    }
  }
  
  if (secure !== undefined) {
    if (secure === 'true') {
      body.secure = secure = true;
    } else if (secure === 'false') {
      body.secure = secure = false;
    }

    if (typeof secure !== 'boolean') {
      return 'Screen must have a secure boolean.';
    }
  }

  return true;
}

exports = module.exports = scaffold.generate(['projects'], ['components'],
  'screens', getDefaultScreen, ALLOWED_FIELDS, validateScreen);
