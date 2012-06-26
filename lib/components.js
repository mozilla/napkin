/*globals exports:true*/
const ALLOWED_FIELDS = {
        layout: undefined,
        action: undefined
      };

var scaffold = require('./scaffold');

/* Get Default Component
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

exports = module.exports = scaffold.generate(['projects', 'screens'],
    ['elements'], 'components', getDefaultComponent, ALLOWED_FIELDS);
