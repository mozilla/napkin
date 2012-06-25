const ALLOWED_FIELDS = {
        title: undefined,
        identifier: undefined,
        required: undefined,
        layout: undefined,
        src: undefined
      };

var scaffold = require('./scaffold');

/* Get Element Prefix
 * Requires: web request
 * Returns: database prefix for elements
 */
function getElementPrefix(req) {
  return 'project:' + req.body.project_id + ':component:' + req.params.id +
    ':element';
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

exports = module.exports = scaffold.generate(getElementPrefix,
    getDefaultElement, ALLOWED_FIELDS);
