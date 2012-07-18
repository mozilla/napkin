/*globals exports:true*/
const ALLOWED_FIELDS = {
  layout: {
    row: undefined,
    col: undefined
  },
  action: undefined
};

var scaffold = require('./scaffold');

/* Get default component
 * Requires: web request
 * Returns: default component data
 */
function getDefaultComponent(req) {
  var defaultComponent = {
    type: req.body.type,
    action: req.body.action
  };

  // be conservative when setting defaultComponent.layout to req.body.layout;
  // the latter may have more than just row and col
  if (req.body.layout) {
    defaultComponent.layout = {
      row: req.body.layout.row,
      col: req.body.layout.col
    };
  }

  return defaultComponent;
}

/* Validate component
 * Requires:
 *  req - web request,
 *  beingCreated - true if this component is being created for the first time
 *    and false otherwise
 * Returns: true if the request is valid to create/update a component or an
 *  error message otherwise
 */
function validateComponent(req, beingCreated) {
  var body = req.body;
  var type = body.type;
  var action = body.action;

  if (!body.layout) {
    return 'Component must have a layout.';
  } else if (typeof body.layout.row !== 'number' ||
             typeof body.layout.col !== 'number') {
    return 'Component must have a numeric row and column.';
  } else if (typeof type !== 'string') {
    return 'Component must have a type.';
  } else if (type.length < 1 || type.length > 20) {
    return 'Component must have a type between 1 and 20 characters long.';
  }
  
  if (action !== undefined) {
    if (typeof action === 'string') {
      body.action = action = parseInt(action, 10);
    }

    if (typeof action !== 'number') {
      return "Component's action must be a numeric id";
    }
  }

  return true;
}

exports = module.exports = scaffold.generate(['projects', 'screens'],
  ['elements'], 'components', getDefaultComponent, ALLOWED_FIELDS,
  validateComponent);
