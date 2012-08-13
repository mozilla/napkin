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
 *    false otherwise,
 *  db - db connection
 * Calls: callback([error]):
 *  error - if there was a validation issue, this is an error message that
 *    explains it; otherwise, this argument is not provided.
 */
function validateScreen(req, beingCreated, db, callback) {
  var body = req.body;
  var title = body.title;
  var isStart = body.isStart;
  var secure = body.secure;

  // TODO: validate isStart and layout
  if (!title) {
    callback('Screen must have a title.');
    return;
  } else if (title.length < 1 || title.length > 20) {
    callback('Screen must have a title between 1 than 20 characters long.');
    return;
  }
  
  if (isStart !== undefined) {
    if (isStart === 'true') {
      body.isStart = isStart = true;
    } else if (isStart === 'false') {
      body.isStart = isStart = false;
    }

    if (typeof isStart !== 'boolean') {
      callback('Screen must have an isStart boolean.');
      return;
    }
  }
  
  if (secure !== undefined) {
    if (secure === 'true') {
      body.secure = secure = true;
    } else if (secure === 'false') {
      body.secure = secure = false;
    }

    if (typeof secure !== 'boolean') {
      callback('Screen must have a secure boolean.');
      return;
    }
  }

  exports.list(req, db, function(err, screenList) {
    if (err) {
      throw err;
    } else {
      for (var i = 0; i < screenList.length; i++) {
        if (screenList[i].title.toLowerCase() === title.toLowerCase()) {
          callback('Screen must have a unique case-insensitive title.');
          return;
        }
      }

      // everything has been validated; there are no errors
      callback();
    }
  });
}

exports = module.exports = scaffold.generate(['projects'], ['components'],
  'screens', getDefaultScreen, ALLOWED_FIELDS, validateScreen);
