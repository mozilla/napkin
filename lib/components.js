const ALLOWED_FIELDS = {
        layout: undefined,
        action: undefined
      };

var scaffold = require('./scaffold');

/* Get Component Prefix
 * Requires: web request
 * Returns: database prefix for components
 */
function getComponentPrefix(req) {
  return 'project:' + req.body.project_id + ':screen:' + req.params.id
    + ':component';
}

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

exports = module.exports = scaffold.generate(getComponentPrefix,
    getDefaultComponent, ALLOWED_FIELDS);
