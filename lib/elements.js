/*globals exports:true*/
const ALLOWED_FIELDS = {
  // positioning fields
  // > whether this is the head element in the linked list
  head: undefined,

  // > id of next element to form a linked list
  nextId: undefined,

  // input fields
  name: undefined,
  required: undefined,

  // heading/paragraph fields
  text: undefined,

  // > heading level (1-6)
  level: undefined,

  // auth field
  // > which screen to redirect to on login
  redirect: undefined,

  // screen/external link fields
  // ^ text
  screen: undefined,
  url: undefined
};

var scaffold = require('./scaffold');
var screens = require('./screens');

// regular expression to match a URL
var urlRegex = /\b((?:[a-z][\w\-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i;

/* Get default element
 * Requires: web request
 * Returns: default element data
 */
function getDefaultElement(req) {
  return {
    type: req.body.type,
    head: req.body.head,
    nextId: req.body.nextId,
    name: req.body.name,
    required: req.body.required || false,
    text: req.body.text,
    level: req.body.level,
    redirect: req.body.redirect,
    screen: req.body.screen,
    url: req.body.url
  };
}


/* Validate element
 * Requires:
 *  req - web request,
 *  beingCreated - true if this element is being created for the first time and
 *    false otherwise,
 *  db - db connection,
 *  callback
 * Calls: callback([error]):
 *  error - if there was a validation issue, this is an error message that
 *    explains it; otherwise, this argument is not provided.
 */
function validateElement(req, beingCreated, db, callback) {
  var body = req.body;
  var type = body.type;
  var nextId = body.nextId;
  var name = body.name;
  var required = body.required;
  var text = body.text;
  var level = body.level;
  var redirect = body.redirect;
  var screen = body.screen;
  var url = body.url;
  var failedCallback = false;

  // TODO: refactor these out to validation helpers
  // TODO: Should these be on both the client and server side? If so, how
  // should they be kept in sync?
  if (typeof type !== 'string') {
    callback('Element must have a type.');
    return;
  } else if (type.length < 1 || type.length > 20) {
    callback("Element must have a type between 1 and 20 characters long.");
    return;
  } else if (nextId && typeof nextId !== 'number') {
    callback("Element's nextId must be an integer.");
    return;
  }

  if (required !== undefined) {
    if (required === 'true') {
      body.required = required = true;
    } else if (required === 'false') {
      body.required = required = false;
    }

    if (typeof required !== 'boolean') {
      callback("Element's required attribute must be a boolean.");
      return;
    }
  }

  if (name !== undefined) {
    if (typeof name !== 'string') {
      callback("Element's name must be a string.");
      return;
    } else if (name.length < 1 || name.length > 50) {
      callback("Element's name must be between 1 and 50 characters long.");
      return;
    }
  }

  if (text !== undefined) {
    if (typeof text !== 'string') {
      callback("Element's text must be a string.");
      return;
    } else if (text.length < 1 || text.length > 500) {
      callback("Element's text must be between 1 and 500 characters long.");
      return;
    }
  }

  if (level !== undefined) {
    if (typeof level === 'string') {
      body.level = level = parseInt(level, 10);
    }

    if (typeof level !== 'number') {
      callback("Element's level must be a number.");
      return;
    } else if (level < 1 || level > 6) {
      callback("Element's level must be between 1 and 6.");
      return;
    }
  }

  if (redirect !== undefined) {
    if (typeof redirect === 'string') {
      body.redirect = redirect = parseInt(redirect, 10);
    }

    if (typeof redirect !== 'number') {
      callback("Element's redirect must be a number.");
      return;
    } else {
      getScreensById(req, db, function(err, screensById) {
        if (err) {
          throw err;
        } else {
          if (!screensById[redirect]) {
            callback("Element's redirect must correspond to a real screen.");
            failedCallback = true;
          }
        }
      });

      if (failedCallback) {
        return;
      }
    }
  }

  if (screen !== undefined) {
    if (typeof screen === 'string') {
      body.screen = screen = parseInt(screen, 10);
    }

    if (typeof screen !== 'number') {
      callback("Element's screen must be a number.");
      return;
    } else {
      getScreensById(req, db, function(err, screensById) {
        if (err) {
          throw err;
        } else {
          if (!screensById[screen]) {
            callback("Element's screen must correspond to a real screen.");
            failedCallback = true;
          }
        }
      });

      if (failedCallback) {
        return;
      }
    }
  }

  if (url !== undefined) {
    if (typeof url !== 'string') {
      callback("Element's url must be a string.");
      return;
    } else if (!urlRegex.test(url)) {
      callback("Element's url must be in the correct form.");
      return;
    }
  }

  callback();
}

/**
 * Requres: web request, db connection, callback
 * Calls: callback(error, screensById):
 *  error - null if screens were retrieved or an error otherwise
 *  screensById - if error is null, a hash of id => screen
 */
function getScreensById(req, db, callback) {
  if (this.cachedScreensById) {
    callback(null, this.cachedScreensById);
  } else {
    var self = this;
    screens.list(req, db, function(err, screenList) {
      if (err) {
        callback(err);
      } else {
        var screensById = {};
        screenList.forEach(function(screen) {
          screensById[screen.id] = screen;
        });

        self.cachedScreensById = screensById;
        callback(null, screensById);
      }
    });
  }
}

exports = module.exports = scaffold.generate(['projects', 'screens',
  'components'], [], 'elements', getDefaultElement, ALLOWED_FIELDS,
  validateElement);
