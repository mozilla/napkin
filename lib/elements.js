const ALLOWED_FIELDS = {
        title: undefined,
        identifier: undefined,
        required: undefined,
        layout: undefined,
        src: undefined
      };

var scaffold = require('./scaffold');

/* Get Elements Key
 * Requires: web request
 * Returns: database key for elements hash
 */
function getElementsKey(req) {
  return req.session.email + ':project:' + req.params.project_id + ':screen:' +
    req.params.screen_id + ':component:' + req.params.component_id + ':elements';
}

/* Get Default Element
 * Requires: web request
 * Returns: default element data
 */
function getDefaultElement(req) {
  return {
    type: req.body.type,
    title: req.body.title,
    layout: req.body.layout,
    required: req.body.required || false,
    src: req.body.src
  };
}

exports = module.exports = scaffold.generate(getElementsKey,
    getDefaultElement, ALLOWED_FIELDS);
