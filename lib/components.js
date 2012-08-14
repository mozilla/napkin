/*globals exports:true*/
const ALLOWED_FIELDS = {
  row: undefined,
  col: undefined,
  action: undefined
};

var scaffold = require('./scaffold');
var screens = require('./screens');

/* Get default component
 * Requires: web request
 * Returns: default component data
 */
function getDefaultComponent(req) {
  return {
    type: req.body.type,
    row: req.body.row,
    col: req.body.col,
    action: req.body.action
  };
}

/* Validate component
 * Requires:
 *  req - web request,
 *  beingCreated - true if this component is being created for the first time and
 *    false otherwise,
 *  db - db connection,
 *  callback
 * Calls: callback([error]):
 *  error - if there was a validation issue, this is an error message that
 *    explains it; otherwise, this argument is not provided.
 */
function validateComponent(req, beingCreated, db, callback) {
  var body = req.body;
  var type = body.type;
  var row = body.row;
  var col = body.col;
  var action = body.action;

  if (typeof row !== 'number' || typeof col !== 'number') {
    callback('Component must have a numeric row and column.');
    return;
  } else if (typeof type !== 'string') {
    callback('Component must have a type.');
    return;
  } else if (type.length < 1 || type.length > 20) {
    callback('Component must have a type between 1 and 20 characters long.');
    return;
  }
  
  if (action !== undefined) {
    if (typeof action === 'string') {
      body.action = action = parseInt(action, 10);
    }

    if (typeof action !== 'number') {
      callback("Component's action must be a numeric id");
      return;
    } else {
      screens.list(req, db, function(err, screenList) {
        if (err) {
          throw err;
        } else {
          for (var i = 0; i < screenList.length; i++) {
            if (screenList[i].id === action) {
              callback();
              return;
            }
          }

          callback("Component's action must correspond to a real screen.");
        }
      });
    }
  } else {
    callback();
  }
}

exports = module.exports = scaffold.generate(['projects', 'screens'],
  ['elements'], 'components', getDefaultComponent, ALLOWED_FIELDS,
  validateComponent);
