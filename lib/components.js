/*globals exports:true*/
const ALLOWED_FIELDS = {
  layout: undefined,
  action: undefined
};

var scaffold = require('./scaffold');

/* Get default component
 * Requires: web request
 * Returns: default component data
 */
function getDefaultComponent(req) {
  return {
    type: req.body.type,
    layout: req.body.layout,
    action: req.body.action
  };
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

  if (!body.layout) {
    return 'Component must have a layout.';
  } else if (typeof body.layout.row !== 'number' ||
             typeof body.layout.col !== 'number') {
    return 'Component must have a numeric row and column.';
  } else if (typeof type !== 'string' || type.length === 0) {
    return 'Component must have a type.';
  }

  return true;
}

exports = module.exports = scaffold.generate(['projects', 'screens'],
  ['elements'], 'components', getDefaultComponent, ALLOWED_FIELDS,
  validateComponent);
