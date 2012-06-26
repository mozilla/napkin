const ALLOWED_FIELDS = {
        layout: undefined,
        action: undefined
      };

var scaffold = require('./scaffold');

/* Get Components Key
 * Requires: web request
 * Returns: database key for components hash
 */
function getComponentsKey(req) {
  return req.session.email + ':project:' + req.params.project_id + 'screen:' +
    req.params.screen_id + ':components';
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

exports = module.exports = scaffold.generate(getComponentsKey,
    getDefaultComponent, ALLOWED_FIELDS);
